const express = require('express');
const categoryController = require('../controllers/categoryController');
const authController = require('../controllers/authController');
const productRouter = require('./productRoutes');

const router = express.Router();

// router.param('id', categoryController.checkID);

router.use('/:categoryId/products', productRouter);

router.route('/').get(categoryController.getAllCategories);

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'retailor'),
    categoryController.setMakerIds,
    categoryController.createCategory
  );
router.route('/:id').get(categoryController.getCategory);
router
  .patch(
    '/:id',
    authController.protect,
    authController.restrictTo('admin', 'retailor'),
    categoryController.uploadCategoryPhoto,
    categoryController.resizeCategoryPhoto,
    categoryController.updateCategory
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'retailor'),
    categoryController.deleteCategory
  );

module.exports = router;
