import bcrypt from 'bcryptjs';
import { User } from '../models/User.model';
import { Customer } from '../models/Customer.model';
import { Vendor } from '../models/Vendor.model';
import { MenuItem } from '../models/MenuItem.model';

export const seedGuestUsers = async () => {
  try {
    // 1. Seed Customer
    let customerUser = await User.findOne({ email: 'customer@tiffinwala.com' });
    if (!customerUser) {
      customerUser = await User.create({
        firstName: 'Guest',
        lastName: 'Customer',
        age: 24,
        phone: '9999999991',
        email: 'customer@tiffinwala.com',
        password: 'customer@123',
        role: 'customer',
        isPhoneVerified: true,
        isEmailVerified: true,
      });
      console.log('✅ Guest customer user created');
    } else {
      customerUser.isPhoneVerified = true;
      customerUser.isEmailVerified = true;
      customerUser.password = await bcrypt.hash('customer@123', 12);
      await customerUser.save();
    }

    let customerDoc = await Customer.findOne({ userId: customerUser._id });
    if (!customerDoc) {
      customerDoc = await Customer.create({
        userId: customerUser._id,
        location: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
          address: 'FC Road, Shivaji Nagar, Pune',
        },
        walletBalance: 2000,
        friendProfiles: [
          { name: 'Myself (Main)', nickname: 'Self' },
          { name: 'Roommate (Rahul)', nickname: 'Rahul' },
        ],
      });
      console.log('✅ Guest customer profile created');
    } else {
      if (customerDoc.walletBalance < 500) {
        customerDoc.walletBalance = 2000;
        await customerDoc.save();
      }
    }

    // 2. Seed Vendor
    let vendorUser = await User.findOne({ email: 'vendor@tiffinwala.com' });
    if (!vendorUser) {
      vendorUser = await User.create({
        firstName: 'Guest',
        lastName: 'Vendor',
        age: 30,
        phone: '9999999992',
        email: 'vendor@tiffinwala.com',
        password: 'vendor@123',
        role: 'vendor',
        isPhoneVerified: true,
        isEmailVerified: true,
      });
      console.log('✅ Guest vendor user created');
    } else {
      vendorUser.isPhoneVerified = true;
      vendorUser.isEmailVerified = true;
      vendorUser.password = await bcrypt.hash('vendor@123', 12);
      await vendorUser.save();
    }

    let vendorDoc = await Vendor.findOne({ userId: vendorUser._id });
    if (!vendorDoc) {
      vendorDoc = await Vendor.create({
        userId: vendorUser._id,
        businessName: 'TiffinWala Demo Kitchen',
        location: {
          type: 'Point',
          coordinates: [73.8567, 18.5204],
          address: 'FC Road, Shivaji Nagar, Pune',
        },
        deliveryRadiuskm: 20,
        isOpen: true,
        walletBalance: 4500,
        platformBalance: 9999,
        totalRevenue: 28500,
        isPaymentDone: true,
        averageRating: 4.9,
        totalRatings: 38,
      });
      console.log('✅ Guest vendor profile created');
    } else {
      let needsSave = false;
      if (!vendorDoc.isPaymentDone) {
        vendorDoc.isPaymentDone = true;
        needsSave = true;
      }
      if (!vendorDoc.isOpen) {
        vendorDoc.isOpen = true;
        needsSave = true;
      }
      if (needsSave) {
        await vendorDoc.save();
      }
    }

    // Connect Customer to Vendor if not already connected
    if (customerDoc && vendorDoc) {
      if (!customerDoc.myVendors.some(id => id.toString() === vendorDoc._id.toString())) {
        customerDoc.myVendors.push(vendorDoc._id);
        await customerDoc.save();
      }
    }

    // 3. Seed Menu Item for today so vendor has an active menu
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingMenu = await MenuItem.findOne({
      vendorId: vendorDoc._id,
      session: 'lunch',
      date: today,
    });

    if (!existingMenu) {
      await MenuItem.create({
        vendorId: vendorDoc._id,
        session: 'lunch',
        tiers: [
          {
            name: 'Standard Thali',
            items: ['3 Rotis', 'Paneer Butter Masala', 'Dal Fry', 'Jeera Rice', 'Salad'],
            price: 120,
            maxQuantity: 50,
            remainingQuantity: 45,
          },
          {
            name: 'Special Deluxe Thali',
            items: ['4 Butter Rotis', 'Kadhai Paneer', 'Dal Makhani', 'Veg Pulao', 'Gulab Jamun', 'Raita'],
            price: 180,
            maxQuantity: 30,
            remainingQuantity: 28,
          },
        ],
        addOns: [
          { name: 'Extra Roti', price: 10 },
          { name: 'Gulab Jamun (2 pcs)', price: 40 },
          { name: 'Curd Bowl', price: 25 },
        ],
        description: 'Fresh homestyle North Indian meal delivered in stainless insulated tiffin.',
        date: today,
        isExpired: false,
      });
      console.log('✅ Guest vendor demo menu created for today');
    }
  } catch (error) {
    console.error('Error in seedGuestUsers:', error);
  }
};
