const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    productCategory: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'A product must belong to a category'],
    },
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      trim: true,
      maxlength: [
        40,
        "A product's name can have less or equal to 40 characters",
      ],
      minlength: [
        2,
        'A product must have greater than or equal to 2 characters',
      ],
    },
    slug: String,
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //  this only points to current doc on NEW document creation i.e. not on update
          return val < this.price;
        },
        message: 'Discount Price ({VALUE}) should be below printed price',
      },
    },
    summary: {
      type: String,
      trim: true,
      //   required: [true, 'A product must have a description'],
    },
    quantity: {
      type: Number,
      default: 1,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A product must have a description'],
    },
    imageFront: {
      type: String,
      // required: [true, 'A product hmust have a cover image'],
    },
    imageCover: {
      type: String,
      // required: [true, 'A product hmust have a cover image'],
    },
    images: [String],
    uploadedAt: {
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

// Virtual populate
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

// Document Middlewares
productSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
