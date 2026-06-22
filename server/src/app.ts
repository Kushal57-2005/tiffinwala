import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import vendorRoutes from './routes/vendor.routes';
import customerRoutes from './routes/customer.routes';
import orderRoutes from './routes/order.routes';
import connectionRoutes from './routes/connection.routes';
import subscriptionRoutes from './routes/subscription.routes';
import ratingRoutes from './routes/rating.routes';
import notificationRoutes from './routes/notification.routes';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://tiffinwala-kkw.vercel.app',
  'https://tiffinwala-production.up.railway.app',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.includes('vercel.app')) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Server Running for TiffinWala App');
});

app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
});

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});
export default app;
