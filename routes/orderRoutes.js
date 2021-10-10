const express = require('express');
const orderController = require('../controllers/orderController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:productId', orderController.getCheckoutSession);

router.get('/my-orders', authController.protect, orderController.getMyOrders);

router
  .route('/product/:productId')
  .post(orderController.setProductCustomerIds, orderController.createOrder);

router.use(authController.restrictTo('admin', 'retailor'));

router.route('/').get(orderController.getAllOrders);

router
  .route('/:id')
  .get(orderController.getOrder)
  .delete(orderController.deleteOrders);

module.exports = router;
