const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');
const cartRouter = require('./cartRoutes');
const orderController = require('../controllers/orderController');

const router = express.Router({ mergeParams: true });

router.use('/:productId/cart/:cartId', cartRouter);
router.use('/:productId/reviews', reviewRouter);

router
  .route('/top-cheap')
  .get(
    productController.aliasTopProducts,
    orderController.webhookCheckout,
    productController.getAllProducts
  );

router
  .route('/')
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'retailor'),
    productController.setProductCustomerIds,
    productController.createProduct
  );
router
  .route('/:id')
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'retailor'),
    productController.uploadProductImages,
    productController.resizeProductImages,
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'retailor'),
    productController.deleteProduct
  );

module.exports = router;
