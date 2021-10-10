const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const Product = require('../models/productModel');

exports.setProductCustomerIds = (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.customer) req.body.customer = req.customer.id;
  next();
};

exports.getReview = factory.getOne(Review);
// exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);

exports.createReview = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.productId);

  if (product) {
    try {
      const doc = await Review.create(req.body);

      res.status(201).json({
        status: 'success',
        doc,
      });
    } catch (err) {
      res.status(404).json({
        status: 'there is no product',
        err,
      });
    }
  } else {
    res.status(404).json({
      status: 'fail',
      message: 'there is no product matched',
    });
  }
  next();
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  // to allow for nested GET reviews on product (hack)
  let filter = {};
  if (req.params.productId) filter = { product: req.params.productId };
  const doc = await Review.find(filter);

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: doc.length,
    doc,
  });
});
