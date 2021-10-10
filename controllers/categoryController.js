const multer = require('multer');
const sharp = require('sharp');
const Category = require('../models/categoryModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'Not an image! Please upload only images of jpg format.',
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadCategoryPhoto = upload.fields([
  { name: 'photo', maxCount: 1 },
  // { name: 'imageCover', maxCount: 1 },
  // { name: 'images', maxCount: 5 },
]);

exports.resizeCategoryPhoto = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (!req.files.photo) return next();

  // 1) Front image
  req.body.photo = `category-${req.params.id}-${Date.now()}.jpeg`;
  await sharp(req.files.photo[0].buffer)
    .resize(150, 150)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/categories/${req.body.photo}`);

  next();
});

exports.setMakerIds = (req, res, next) => {
  if (!req.body.maker) req.body.maker = req.customer.id;
  next();
};

exports.getAllCategories = factory.getAll(Category);
exports.getCategory = factory.getOne(Category, {
  path: 'maker',
  select: 'name role',
});
exports.createCategory = factory.createOne(Category);
exports.updateCategory = factory.updateOne(Category);
exports.deleteCategory = factory.deleteOne(Category);
