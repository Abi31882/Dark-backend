const Cart = require('../models/cartModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setCustomerId = (req, res, next) => {
  if (!req.body.customer) req.body.customer = req.customer.id;
  next();
};

exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId } = req.params;
  // const { cartId } = req.params; //TODO: the logged in user id

  const doc = await Cart.findById(req.params.cartId);

  if (!doc) {
    return next(new AppError('no cart created', 400));
  }
  const product = doc.product.find((p) => p.id === productId);

  if (product) {
    return next(new AppError('already in the doc', 400));
  }

  doc.product.push(productId);
  await doc.save();
  res.status(200).json({
    status: 'success',
    doc,
  });
});

exports.updateQuantity = catchAsync(async (req, res, next) => {
  const doc = await Cart.findById(req.params.cartId);

  if (!doc) {
    return next(new AppError('there is no doc', 404));
  }

  const product = doc.product.map((el) => el.id === req.params.productId);

  if (!product) {
    return next(
      new AppError(
        'Sorry, there is no such product, please specify correctly',
        404
      )
    );
  }

  if (product) {
    product.quantity = req.body.quantity;

    await doc.save({ validateBeforeSave: false });

    res.status(200).json({
      status: 'success',
      quantity: product.quantity,
    });
  } else {
    next();
  }
});

exports.deleteFromCart = catchAsync(async (req, res, next) => {
  const doc = await Cart.findById(req.params.cartId);

  const d = doc.product.filter((i) => i.id !== req.params.productId);

  doc.product = [];
  doc.product = d;
  if (doc.product.length === 0) {
    doc.product = [];
  }
  await doc.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    doc,
  });
});

exports.getAllCarts = factory.getAll(Cart);
exports.createCart = factory.createOne(Cart);
exports.updateCart = factory.updateOne(Cart);
exports.deleteCart = factory.deleteOne(Cart);

exports.getCart = catchAsync(async (req, res, next) => {
  const doc = await Cart.findOne({ customer: req.customer.id }).exec();

  if (!doc) {
    return next(new AppError('No Cart found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    doc,
  });
});

// exports.getMyCart = catchAsync(async (req, res, next) => {
//   const doc = await Cart.findById(req.params.cartId).exec();

//   if (!doc) {
//     return next(new AppError('No Cart found with that ID', 404));
//   }

//   res.status(200).json({
//     status: 'success',
//     doc,
//   });
// });
