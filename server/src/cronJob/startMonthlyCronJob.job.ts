import cron from 'node-cron';
import mongoose from 'mongoose';
import { Vendor } from '../models/Vendor.model';
import { Order } from '../models/Order.model';
import { MonthlyBill } from '../models/MonthlyBill.model';

export const runMonthlyBillJob = async () => {
  console.log('🧾 Monthly bill job started...');

  const now = new Date();

  // TESTING: current month
  // PRODUCTION: uncomment below and remove the two lines after
  const billMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const billYear =
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  // const billMonth = now.getMonth() + 1;
  // const billYear = now.getFullYear();

  const startOfMonth = new Date(billYear, billMonth - 1, 1);
  const endOfMonth = new Date(billYear, billMonth, 0, 23, 59, 59, 999);

  console.log(
    `📅 Billing period: ${startOfMonth.toDateString()} → ${endOfMonth.toDateString()}`,
  );

  const vendors = await Vendor.find({}).lean();
  console.log(`👥 Processing ${vendors.length} vendors...`);

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const vendorDoc of vendors) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const vendor = await Vendor.findById(vendorDoc._id).session(session);
      if (!vendor) {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      const existingBill = await MonthlyBill.findOne({
        vendorId: vendor._id,
        month: billMonth,
        year: billYear,
      }).session(session);

      if (existingBill) {
        await session.abortTransaction();
        session.endSession();
        skipCount++;
        console.log(`⏭️  Vendor ${vendor._id} — bill already exists, skipping`);
        continue;
      }

      const revenueResult = await Order.aggregate([
        {
          $match: {
            vendorId: vendor._id,
            status: { $in: ['accepted', 'delivered', 'received'] },
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
          },
        },
      ]).session(session);

      const totalRevenue = revenueResult?.[0]?.total ?? 0;
      const orderCount = revenueResult?.[0]?.orderCount ?? 0;

      if (totalRevenue === 0) {
        await session.abortTransaction();
        session.endSession();
        skipCount++;
        console.log(`⏭️  Vendor ${vendor._id} — no revenue, skipping`);
        continue;
      }

      const platformFee = Math.round(totalRevenue * 0.1);

      let deductedFromPlatformBalance = 0;
      let deductedFromWallet = 0;
      let status: 'paid' | 'partial' | 'failed' = 'paid';

      if (vendor.platformBalance >= platformFee) {
        vendor.platformBalance -= platformFee;
        deductedFromPlatformBalance = platformFee;
        status = 'paid';
      } else {
        deductedFromPlatformBalance = vendor.platformBalance;
        const remainingFee = platformFee - vendor.platformBalance;
        vendor.platformBalance = 0;
        vendor.walletBalance -= remainingFee;
        deductedFromWallet = remainingFee;

        if (!vendor.isPlatformDebtFlagged) {
          vendor.isPlatformDebtFlagged = true;
          console.log(
            `🔄 Vendor ${vendor._id} transitioned to self-funding mode`,
          );
        }

        status = vendor.walletBalance < 0 ? 'failed' : 'partial';
      }

      await vendor.save({ session });

      await MonthlyBill.create(
        [
          {
            vendorId: vendor._id,
            month: billMonth,
            year: billYear,
            totalRevenue,
            platformFeeCharged: platformFee,
            netPaid: totalRevenue - platformFee,
            deductedFromPlatformBalance,
            deductedFromWallet,
            status,
            generatedAt: now,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      successCount++;
      console.log(
        `✅ Vendor ${vendor._id} — Revenue: ₹${totalRevenue}, Orders: ${orderCount}, Fee: ₹${platformFee}, Status: ${status}`,
      );
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      failCount++;
      console.error(
        `❌ Bill generation failed for vendor ${vendorDoc._id}:`,
        err,
      );
    }
  }

  console.log(`
🧾 Monthly bill job completed.
✅ Success:  ${successCount}
⏭️  Skipped:  ${skipCount}
❌ Failed:   ${failCount}
    `);
};

export const startMonthlyBillJob = () => {
  cron.schedule('0 0 1 * *', runMonthlyBillJob);
  console.log(
    '📅 Monthly bill cron job registered — runs 1st of every month at midnight',
  );
};
