const multer = require('multer');
const sharp = require('sharp');
const { cloudinary } = require('../utils/cloudinary');
const Product = require('../models/productModel');
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

exports.uploadProductImages = upload.fields([
  { name: 'imageFront', maxCount: 1 },
  { name: 'imageCover', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 },
]);

exports.resizeProductImages = catchAsync(async (req, res, next) => {
  // console.log(req.files);

  if (
    !req.files.imageCover ||
    !req.files.imageFront ||
    !req.files.image1 ||
    !req.files.image2 ||
    !req.files.image3
  )
    return next();

  // 1) Front image
  req.body.imageFront = `product-${req.params.id}-${Date.now()}-front.jpeg`;
  await sharp(req.files.imageFront[0].buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${req.body.imageFront}`);

  // 2) cover image
  req.body.imageCover = `product-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(400, 400)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${req.body.imageCover}`);

  // 3) images

  req.body.image1 = `product-${req.params.id}-${Date.now()}-image1.jpeg`;
  await sharp(req.files.image1[0].buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${req.body.image1}`);

  req.body.image2 = `product-${req.params.id}-${Date.now()}-image2.jpeg`;
  await sharp(req.files.image2[0].buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${req.body.image2}`);

  req.body.image3 = `product-${req.params.id}-${Date.now()}-image3.jpeg`;
  await sharp(req.files.image3[0].buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/products/${req.body.image3}`);

  // req.body.images = [];

  // await Promise.all(
  //   req.files.images.map(async (file, i) => {
  //     const filename = `product-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

  //     await sharp(file.buffer)
  //       .resize(500, 500)
  //       .toFormat('jpeg')
  //       .jpeg({ quality: 90 })
  //       .toFile(`public/img/products/${filename}`);

  //     req.body.images.push(filename);
  //   })
  // );
  const fileStr1 = `public/img/products/${req.body.imageFront}`;
  const fileStr2 = `public/img/products/${req.body.imageCover}`;
  const fileStr3 = `public/img/products/${req.body.image1}`;
  const fileStr4 = `public/img/products/${req.body.image2}`;
  const fileStr5 = `public/img/products/${req.body.image3}`;

  const uploadedResponse1 = await cloudinary.uploader.upload(fileStr1);
  const uploadedResponse2 = await cloudinary.uploader.upload(fileStr2);
  const uploadedResponse3 = await cloudinary.uploader.upload(fileStr3);
  const uploadedResponse4 = await cloudinary.uploader.upload(fileStr4);
  const uploadedResponse5 = await cloudinary.uploader.upload(fileStr5);

  req.body.imageFront = `https://res.cloudinary.com/dzrmunwn7/image/upload/v${uploadedResponse1.version}/${uploadedResponse1.public_id}.jpg`;
  req.body.imageCover = `https://res.cloudinary.com/dzrmunwn7/image/upload/v${uploadedResponse2.version}/${uploadedResponse2.public_id}.jpg`;
  req.body.image1 = `https://res.cloudinary.com/dzrmunwn7/image/upload/v${uploadedResponse3.version}/${uploadedResponse3.public_id}.jpg`;
  req.body.image2 = `https://res.cloudinary.com/dzrmunwn7/image/upload/v${uploadedResponse4.version}/${uploadedResponse4.public_id}.jpg`;
  req.body.image3 = `https://res.cloudinary.com/dzrmunwn7/image/upload/v${uploadedResponse5.version}/${uploadedResponse5.public_id}.jpg`;
  req.body.version = `${uploadedResponse1.version}`;
  req.body.public_id = `${uploadedResponse1.public_id}`;
  // console.log(uploadedResponse);
  // console.log(
  //   `https://res.cloudinary.com/dzrmunwn7/image/upload/v${req.body.version}/${req.body.public_id}.jpg`
  // );

  next();
});

exports.aliasTopProducts = (req, res, next) => {
  req.query.limit = '50';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,description';
  next();
};

exports.setProductCustomerIds = (req, res, next) => {
  if (!req.body.productCategory)
    req.body.productCategory = req.params.categoryId;
  if (!req.body.customer) req.body.customer = req.customer.id;
  next();
};

exports.getAllProducts = factory.getAll(Product);
exports.getProduct = factory.getOne(Product, { path: 'reviews' });
exports.createProduct = factory.createOneProduct(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);

// exports.getBySearch = catchAsync(async (req, res, next) => {
//   // let filter = {};
//   // if (req.query) filter = { name: req.query.query };
//   const docu = await Product.find();

//   const doc = docu.map((el) => {
//     if (el.name.includes(req.query.query)) {
//       // const e = null;
//       // console.log(el);
//       return el;
//     }
//   });

//   res.status(200).json({
//     doc,
//   });
// });

// catchAsync(async (req, res, next) => {
//   // to allow for nested GET reviews on product (hack)
//   let filter = {};
//   if (req.params.categoryId)
//     filter = { productCategory: req.params.categoryId };
//   const features = new APIFeatures(Model.find(filter), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const doc = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: doc.length,
//     doc,
//   });
