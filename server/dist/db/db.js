"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URL;
        if (!mongoURI) {
            throw new Error('MONGO_URL is not defined');
        }
        await mongoose_1.default.connect(mongoURI);
        console.log('✅ mongoDB connected successfully.');
    }
    catch (error) {
        console.error('❌ MongoDB connection error', error);
        process.exit(1);
    }
};
exports.default = connectDB;
//# sourceMappingURL=db.js.map