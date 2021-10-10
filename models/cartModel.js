const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
  {
    product: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        //   required: [true, 'Cart must belong to a product'],
      },
    ],
    customer: {
      type: mongoose.Schema.ObjectId,
      ref: 'Customer',
      unique: true,
      required: [true, 'cart must belong to a customer'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

cartSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'product',
  });

  next();
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
