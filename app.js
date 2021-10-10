const path = require('path');
const express = require('express');
const morgan = require('morgan');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
// const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');

const globalErrorHandler = require('./controllers/errorController');
const AppError = require('./utils/appError');
const productRouter = require('./routes/productRoutes');
const customerRouter = require('./routes/customerRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const cartRouter = require('./routes/cartRoutes');
const orderRouter = require('./routes/orderRoutes');
const orderController = require('./controllers/orderController');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.enable('trust proxy');

app.use(express.json());

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());

app.options('*', cors());

app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/', limiter);

app.post(
  '/webhook-checkout',
  bodyParser.raw({ type: 'application/json' }),
  orderController.webhookCheckout
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log('development');
}

// production logging
if (process.env.NODE_ENV === 'production') {
  // console.log('production');
  console.log('production');
}

app.use(express.json());

app.use(mongoSanitize());

app.use(xss());

// app.use(
//   hpp({
//     whitelist: [
//       'duration',
//       'ratingsQuantity',
//       'difficulty',
//       'ratingsAverage',
//       'maxGroupSize',
//       'price',
//     ],
//   })
// );

app.use(compression());

// START EXPRESS APP

// 2) Routes
app.use('/', viewRouter);

app.use('/categories', categoryRouter);
app.use('/products', productRouter);
app.use('/customers', customerRouter);
app.use('/reviews', reviewRouter);
app.use('/cart', cartRouter);
app.use('/orders', orderRouter);

// app.use('/bookings', orderRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
