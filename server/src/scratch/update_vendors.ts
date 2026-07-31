import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Vendor } from '../models/Vendor.model';
import connectDB from '../db/db';

const runMigration = async () => {
  try {
    console.log('Starting migration to update vendor balances...');

    // Connect to database
    await connectDB();

    // Fetch all vendors
    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors in the database.`);

    for (const vendor of vendors) {
      const oldWallet = vendor.walletBalance;
      const oldPlatform = vendor.platformBalance || 0;

      vendor.walletBalance = oldWallet - 9999;
      vendor.platformBalance = oldPlatform + 9999;

      await vendor.save();
      console.log(`Updated Vendor: ${vendor.businessName || 'Unknown'} (ID: ${vendor._id})
        - Wallet: ₹${oldWallet} -> ₹${vendor.walletBalance}
        - Platform Balance: ₹${oldPlatform} -> ₹${vendor.platformBalance}`);
    }

    console.log('✅ Vendor balances updated successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

runMigration();
