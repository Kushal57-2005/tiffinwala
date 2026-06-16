import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import connectDB from './db/db';

const port = process.env.PORT;


connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log('Server is started on http://localhost:5000/');
        });
    })
    .catch((err) => {
        console.log('MongoDB connection error', err);
        process.exit(1);
    });
