const express = require('express');
const cartController = require('../controllers/cartController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .post(authController.restrictTo('customer'), cartController.addToCart)
  .patch(authController.restrictTo('customer'), cartController.updateQuantity)
  .delete(authController.restrictTo('customer'), cartController.deleteFromCart);

router
  .route('/all')
  .get(authController.restrictTo('admin'), cartController.getAllCarts);

router.use(cartController.setCustomerId);

router.route('/create').post(
  authController.restrictTo('customer'),

  cartController.createCart
);

router
  .route('/myCart/:id')
  .get(cartController.getCart)
  .delete(
    authController.restrictTo('customer', 'admin'),
    cartController.deleteCart
  );

module.exports = router;
