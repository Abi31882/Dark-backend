const mongoose = require('mongoose');
const slugify = require('slugify');
// const Customer = require('./customerModel');

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: [true, 'A category must have a categoryName'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A category name can have less or equal to 40 characters',
      ],
      minlength: [
        2,
        'A category must have greater than or equal to 2 characters',
      ],
      // validate: [validator.isAlpha, 'Category name must only contain characters'],
    },
    maker: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
      required: [true, 'it is required'],
    },

    slug: String,
    description: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      default: 'defaultCategory.jpg',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// categorySchema.index({ price: 1 });
// categorySchema.index({ price: 1, ratingsAverage: -1 });
// categorySchema.index({ slug: 1 });
// categorySchema.index({ startLocation: '2dsphere' });

// categorySchema.virtual('durationWeeks').get(function () {
//   return this.duration / 7;
// });

// Virtual populate
// categorySchema.virtual('reviews', {
//   ref: 'Review',
//   foreignField: 'category',
//   localField: '_id',
// });

// Document Middlewares
categorySchema.pre('save', function (next) {
  this.slug = slugify(this.categoryName, { lower: true });
  next();
});

// categorySchema.pre('save', async function (req, res, next) {
//   const customer = await Customer.findById(req.customer.id);

//   this.maker = customer.id;
//   next();
// });

// categorySchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// categorySchema.pre(/^find/, function (next) {
//   this.populate({
//     path: 'maker',
//     select: '-__v -passwordChangedAt',
//   });
//   next();
// });

// categorySchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// Query Middlewares
// categorySchema.pre(/^find/, function (next) {
//   this.find({ secretTour: { $ne: true } });

//   this.start = Date.now();
//   next();
// });

// categorySchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds!`);
//   console.log(docs);
//   next();
// });

// Aggregation Middleware
// categorySchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secrettour: { $ne: true } } });

//   console.log(this);
//   next();
// });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
