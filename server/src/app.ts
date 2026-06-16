import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import paymentRoutes from './routes/payment.routes';
import vendorRoutes from './routes/vendor.routes';
import customerRoutes from './routes/customer.routes';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();
app.use(
    cors({
        origin: ['http://localhost:5173', 'https://tiffinwala-kkw.vercel.app'],
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

// Global Error Handler Middleware
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
