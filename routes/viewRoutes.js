const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/', authController.isLoggedIn, viewsController.getOverview);

router.get(
  '/product/:productId',
  authController.isLoggedIn,
  viewsController.getProduct
);

router.get('/my-orders', authController.protect, viewsController.getMyOrders);

router.post(
  '/submit-customer-data',
  authController.protect,
  viewsController.updateCustomerData
);
module.exports = router;
