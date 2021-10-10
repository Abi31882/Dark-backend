const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const Customer = require('../models/customerModel');
// const Category = require('../models/categoryModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (doc, statusCode, req, res) => {
  const token = signToken(doc._id);

  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });
  // remove the password from the output
  doc.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    doc,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newCustomer = await Customer.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    photo: req.body.photo,
    address: req.body.address,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newCustomer, url).sendWelcome();

  createSendToken(newCustomer, 201, req, res);
  // console.log(res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) IF EMAIL & PASSWORD EXISTS
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) CHECK IF Customer EXISTS && PASSWORD IS CORRECT
  const customer = await Customer.findOne({ email }).select('+password');
  // const correct = await customer.correctPassword(password, customer.password);

  if (
    !customer ||
    !(await customer.correctPassword(password, customer.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) IF EVERYTHING OK, SEND TOKEN TO CLIENT
  createSendToken(customer, 200, req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in.Please login to get Access', 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) Check if customer still exists
  const currentCustomer = await Customer.findById(decoded.id);
  if (!currentCustomer) {
    return next(
      new AppError(
        'the customer belonging to this token does no longer exists',
        401
      )
    );
  }

  // 4) check if customer changed password after the token was issued

  if (currentCustomer.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'Customer recently changed password, please login again',
        401
      )
    );
  }

  // grant access to protected route
  req.customer = currentCustomer;
  res.locals.customer = currentCustomer;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if customer still exists
      const currentCustomer = await Customer.findById(decoded.id);
      if (!currentCustomer) {
        return next();
      }

      // 3) Check if customer changed password after the token was issued
      if (currentCustomer.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN Customer
      res.locals.customer = currentCustomer;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array ['admin', 'lead-guide']
    if (!roles.includes(req.customer.role)) {
      return next(
        new AppError('you do not have permission to perform this action', 403)
      );
    }

    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get customer based on posted email
  const customer = await Customer.findOne({ email: req.body.email });
  if (!customer) {
    return next(
      new AppError('there is no customer with this email address', 404)
    );
  }

  // 2) generate the random reset token
  const resetToken = customer.createPasswordResetToken();
  await customer.save({ validateBeforeSave: false });

  // 3) send it to customer's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/customers/resetPassword/${resetToken}`;
    await new Email(customer, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'token sent to email',
    });
  } catch (err) {
    customer.passwordResetToken = undefined;
    customer.passwordResetExpires = undefined;
    await customer.save({ validateBeforeSave: false });

    return next(
      new AppError('there was an error sending the email, try again later', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get customer based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const customer = await Customer.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has not expired, and there is customer, set the new password
  if (!customer) {
    return next(new AppError('token is invalid or has expired', 400));
  }
  customer.password = req.body.password;
  customer.passwordConfirm = req.body.passwordConfirm;
  customer.passwordResetToken = undefined;
  customer.passwordResetExpires = undefined;
  await customer.save();

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(customer, url).sendPasswordChangedSuccess();

  // 3) update changedPasswordAt property at the customer
  // 4) Log the customer in, send JWT

  createSendToken(customer, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get the customer from the collection
  const customer = await Customer.findById(req.customer.id).select('+password');

  // 2) check if the posted password is correct
  if (!customer.correctPassword(req.body.passwordCurrent, customer.password))
    return next(new AppError('your current password is wrong', 401));

  // 3) if so, update password
  customer.password = req.body.password;
  customer.passwordConfirm = req.body.passwordConfirm;
  await customer.save();
  // Customer

  // 4) log customer in, send JWT
  createSendToken(customer, 200, req, res);
});
