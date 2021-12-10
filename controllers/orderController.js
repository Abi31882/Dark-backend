const stripe = require('stripe')(
  'sk_test_51Ju6xDSHY9y2p2gcm0fDPikXYs3bbJjGD5sA8BreueaqJwR5eDIJpH9SATlLHaHziiav2Pk25nBjiIqQPkNG625R00Fn54dHDG'
);
const Product = require('../models/productModel');
const Customer = require('../models/customerModel');
const Order = require('../models/orderModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');

exports.setProductCustomerIds = catchAsync(async (req, res, next) => {
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.customer) req.body.customer = req.customer.id;

  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new AppError('no document found', 404));
  }
  const { price } = product;

  if (!req.body.price) req.body.price = price;

  next();
});

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked product
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return next(new AppError('there is no such product', 404));
  }
  Order.create({
    product: req.params.productId,
    customer: req.customer.id,
  });
  // console.log(product);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-products/?product=${
    //   req.params.tourId
    // }&customer=${req.customer.id}&price=${product.price}`,
    success_url: `https://zen-varahamihira-1a4783.netlify.app/products`,
    cancel_url: `https://zen-varahamihira-1a4783.netlify.app/${product.id}`,
    customer_email: req.customer.email,
    client_reference_id: req.params.productId,
    line_items: [
      {
        name: `${product.name}`,
        description: product.description,
        images: [
          `https://dark-3.herokuapp.com/img/products/${product.imageFront}`,
        ],
        amount: product.price * 100,
        currency: 'inr',
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// const createBookingCheckout = async (session) => {
//   const product = session.client_reference_id;
//   const customer = (await Customer.findOne({ email: session.customer_email }))
//     .id;
//   const price = session.amount_total;

// };

const createBookingCheckout = async (session) => {
  const product = session.client_reference_id;
  const customer = (await Customer.findOne({ email: session.customer_email }))
    .id;
  const price = session.amount_total;
  await Order.create({ product, customer, price });
};

exports.webhookCheckout = (req, res, next) => {
  let event;
  const payload = {
    id: 'we_1Ju89ySEDdC22uUYAT6NyRAL',
    object: 'event',
  };

  const payloadString = JSON.stringify(payload, null, 2);
  const secret = 'whsec_2RvTFQLL5HJrtOoC1h9XQC5DUAUbqbCI';

  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret,
  });
  try {
    event = stripe.webhooks.constructEvent(payloadString, header, secret);
    // if (event.type === 'checkout.session.completed') {
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ received: true });
};

// exports.createOrder = factory.createOne(Order);
exports.getOrder = factory.getOne(Order);
exports.getAllOrders = factory.getAll(Order);
exports.updateOrders = factory.updateOne(Order);
exports.deleteOrders = factory.deleteOne(Order);

exports.getMyOrders = catchAsync(async (req, res, next) => {
  // 1) find all the products
  const orders = await Order.find({ customer: req.customer.id });

  // 2) find tour with the returned id
  const productIDs = orders.map((el) => el.product);
  const doc = await Product.find({ _id: { $in: productIDs } });

  res.status(200).json(doc);
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const doc = await Order.create({
    product: req.params.productId,
    customer: req.customer.id,
  });

  // c/onst product = await Product.findById(req.parms.productId);
  // const customer = await Customer.findById(req.customer.id);

  // if (!product || !customer) {
  //   return next(new AppError('no document or duplicate one', 404));
  // }

  res.status(201).json({
    status: 'success',
    doc,
  });
});
