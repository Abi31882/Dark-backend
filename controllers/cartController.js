const Cart = require('../models/cartModel');
const factory = require('./handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Product = require('../models/productModel');

exports.setCustomerId = (req, res, next) => {
  if (!req.body.customer) req.body.customer = req.customer.id;
  next();
};

exports.addToCart = catchAsync(async (req, res, next) => {
  const doc = await Cart.findById(req.params.cartId);
  const products = await Product.findById(req.params.productId);
  if (!doc) {
    return next(
      new AppError(
        'Sorry, there is no doc created, please create a doc first',
        404
      )
    );
  }

  if (!products) {
    return next(
      new AppError(
        'Sorry, there is no such product, please specify correctly',
        404
      )
    );
  }

  if (doc.product.includes(req.params.productId)) {
    return next(
      new AppError(
        'this product is already in the doc, please increase the quantity manually',
        404
      )
    );
  }
  doc.product.push(req.params.productId);

  await doc.save({ validateBeforeSave: false });

  // const product = await doc.product.map((el) => el === req.params.productId);
  // console.log(product);

  // if (product) {
  //   return next(
  //     new AppError(
  //       'this product is already in the doc, please increase the quantity manually',
  //       404
  //     )
  //   );
  // }

  res.status(200).json(doc);
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
  const products = await Product.findById(req.params.productId);

  const index = doc.product.indexOf(products);

  if (products) {
    doc.product.splice(index, 1);
  } else {
    return next(new AppError('the product is not in the cart', 404));
  }

  await doc.save({ validateBeforeSave: false });

  res.status(200).json(doc);
});

exports.getAllCarts = factory.getAll(Cart);
exports.createCart = factory.createOne(Cart);
exports.updateCart = factory.updateOne(Cart);
exports.deleteCart = factory.deleteOne(Cart);

exports.getCart = catchAsync(async (req, res, next) => {
  const doc = await Cart.findById(req.params.id);

  if (!doc) {
    return next(new AppError('No Cart found with that ID', 404));
  }

  res.status(200).json(doc);
});
