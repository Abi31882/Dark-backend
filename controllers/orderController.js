const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
  // console.log(product);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-products/?product=${
    //   req.params.tourId
    // }&customer=${req.customer.id}&price=${product.price}`,
    success_url: `${req.protocol}://${req.get('host')}/products`,
    cancel_url: `${req.protocol}://${req.get('host')}/products/${product.id}`,
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

const createBookingCheckout = async (session) => {
  const product = session.client_reference_id;
  const customer = (await Customer.findOne({ email: session.customer_email }))
    .id;
  const price = session.display_items[0].amount / 100;
  await Order.create({ product, customer, price });
};

exports.webhookCheckout = (request, response, next) => {
  const signature = request.headers['stripe-signature'];
  // const event = request.body
  let event;
  const paymentIntent = event.data.object;
  // const headers = JSON.parse(event.headers);
  try {
    event = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return response.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'charge.succeeded') createBookingCheckout(paymentIntent);

  response.status(200).json({ received: true });
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

  res.status(200).json({
    status: 'success',
    doc,
  });
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const doc = await Order.create(req.body);

  const product = await Product.findById(req.body.product);
  const customer = await Customer.findById(req.body.customer);

  if (!product || !customer) {
    return next(new AppError('no document or duplicate one', 404));
  }

  res.status(201).json({
    status: 'success',
    doc,
  });
});
