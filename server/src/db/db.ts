import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URL;

        if (!mongoURI) {
            throw new Error('MONGO_URL is not defined');
        }

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
        });

        console.log('✅ mongoDB connected successfully.');
    } catch (error) {
        console.error('❌ MongoDB connection error', error);
        process.exit(1);
    }
};

export default connectDB;