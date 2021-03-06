const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.route('/').get(reviewController.getAllReviews);

router.use(authController.protect);

router
  .route('/')
  // .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('customer'),
    reviewController.setProductCustomerIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('customer', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('customer', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
