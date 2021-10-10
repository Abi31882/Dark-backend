const Product = require('../models/productModel');
const Customer = require('../models/customerModel');
const catchAsync = require('../utils/catchAsync');
const Order = require('../models/orderModel');
const AppError = require('../utils/appError');

// exports.alerts = (req, res, next) => {
//   const { alert } = req.query;
//   if (alert === 'booking')
//     res.locals.alert =
//       "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediatly, please come back later.";
//   next();
// };

exports.getOverview = catchAsync(async (req, res) => {
  // 1) get product data from collection
  const doc = await Product.find();

  res.status(200).json({
    status: 'success',
    doc,
  });
});

exports.getProduct = catchAsync(async (req, res, next) => {
  // 1) get the data, for the requested product (including reviews and guides)
  const doc = await Product.findById(req.params.productId).populate({
    path: 'reviews',
    fields: 'review rating customer',
  });

  if (!doc) {
    return next(new AppError('There is no doc with that name.', 404));
  }

  res.status(200).json({
    status: 'success',
    doc,
  });
});

// exports.getAccount = (req, res) => {
//   res.status(200).render('account', {
//     title: 'Your account',
//   });
// };

exports.getMyOrders = catchAsync(async (req, res, next) => {
  // 1) find all the products
  const orders = await Order.find({ customer: req.customer.id });

  // 2) find product with the returned id
  const productIDs = orders.map((el) => el.product);
  const doc = await Product.find({ _id: { $in: productIDs } });

  res.status(200).json({
    status: 'success',
    doc,
  });
});

exports.updateCustomerData = catchAsync(async (req, res, next) => {
  const doc = await Customer.findByIdAndUpdate(
    req.customer.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: 'success',
    doc,
  });
});
