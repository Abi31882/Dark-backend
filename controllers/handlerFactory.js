const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const Category = require('../models/categoryModel');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json(null);
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      doc,
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json(doc);
  });

exports.createOneProduct = (Model) =>
  catchAsync(async (req, res, next) => {
    const category = await Category.findById(req.params.categoryId);

    if (category) {
      try {
        const doc = await Model.create(req.body);

        res.status(201).json({
          status: 'success',
          doc,
        });
      } catch (err) {
        res.status(404).json(err);
      }
    } else {
      res.status(404).json('there is no category matched');
    }
    next();
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      doc,
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    if (req.query.query) {
      const docu = await Model.find({
        $or: [{ name: { $regex: req.query.query } }],
      });

      res.status(200).json(docu);
    } else {
      // to allow for nested GET reviews on product (hack)
      let filter = {};
      if (req.params.categoryId)
        filter = { productCategory: req.params.categoryId };
      const features = new APIFeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
      const doc = await features.query;

      // SEND RESPONSE
      res.status(200).json(doc);
    }
  });
