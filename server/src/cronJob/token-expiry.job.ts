import { Subscription } from '../models/Subscription.model';
import { createNotification } from '../utils/notification';
import cron from 'node-cron';

export const runTokenExpiryJob = async () => {
  console.log('🔄 Token expiry job started...');

  const now = new Date();

  // 3-day warning window
  const warningEnd = new Date();
  warningEnd.setDate(now.getDate() + 3);
  warningEnd.setHours(23, 59, 59, 999);

  const expiryWarnings = await Subscription.find({
    expiryDate: {
      $gte: now,
      $lte: warningEnd,
    },
    status: 'active',
    expiryWarningSent: { $ne: true },
  })
    .populate('vendorId', 'businessName')
    .populate('customerId', 'userId');

  let expiryWarnCount = 0;

  for (const sub of expiryWarnings) {
    try {
      const vendor = sub.vendorId as any;
      const vendorName = vendor?.businessName || 'your vendor';

      const customer = sub.customerId as any;
      const targetUserId = customer?.userId;
      if (!targetUserId) {
        console.error(
          `❌ No user found for customer in subscription ${sub._id}`,
        );
        continue;
      }

      await createNotification({
        userId: targetUserId,
        type: 'subscription',
        title: 'Plan Expiring Soon ⚠️',
        message: `Your "${sub.planName}" plan with ${vendorName} 
expires on ${sub.expiryDate.toDateString()}.
You have ${sub.remainingTokens} token${sub.remainingTokens === 1 ? '' : 's'} left.`,
        data: { subId: sub._id },
      });

      sub.expiryWarningSent = true;
      await sub.save();

      expiryWarnCount++;
    } catch (err) {
      console.error(`❌ Expiry warning failed for ${sub._id}`, err);
    }
  }

  const lowTokenWarnings = await Subscription.find({
    remainingTokens: { $lte: 2 }, // threshold
    status: 'active',
    tokenWarningSent: { $ne: true },
  })
    .populate('vendorId', 'businessName')
    .populate('customerId', 'userId');

  let tokenWarnCount = 0;

  for (const sub of lowTokenWarnings) {
    try {
      const vendor = sub.vendorId as any;
      const vendorName = vendor?.businessName || 'your vendor';

      const customer = sub.customerId as any;
      const targetUserId = customer?.userId;
      if (!targetUserId) {
        console.error(
          `❌ No user found for customer in subscription ${sub._id}`,
        );
        continue;
      }

      await createNotification({
        userId: targetUserId,
        type: 'subscription',
        title: 'Low Tokens Alert ⚠️',
        message: `Your "${sub.planName}" plan with ${vendorName} 
has only ${sub.remainingTokens} token${sub.remainingTokens === 1 ? '' : 's'} left.
Recharge soon to avoid interruption.`,
        data: { subId: sub._id },
      });

      sub.tokenWarningSent = true;
      await sub.save();

      tokenWarnCount++;
    } catch (err) {
      console.error(`❌ Token warning failed for ${sub._id}`, err);
    }
  }

  const expiredSubs = await Subscription.find({
    status: 'active',
    expiryDate: { $lt: now },
  })
    .populate('vendorId', 'businessName')
    .populate('customerId', 'userId');

  let expiredCount = 0;

  for (const sub of expiredSubs) {
    try {
      const vendor = sub.vendorId as any;
      const vendorName = vendor?.businessName || 'your vendor';

      sub.status = 'expired';
      await sub.save();

      const customer = sub.customerId as any;
      const targetUserId = customer?.userId;
      if (!targetUserId) {
        console.error(
          `❌ No user found for customer in subscription ${sub._id}`,
        );
        continue;
      }

      await createNotification({
        userId: targetUserId,
        type: 'subscription',
        title: 'Plan Expired ❌',
        message: `Your "${sub.planName}" plan with ${vendorName} has expired.
You had ${sub.remainingTokens} unused token${
          sub.remainingTokens === 1 ? '' : 's'
        } remaining.`,
        data: { subId: sub._id },
      });

      expiredCount++;
    } catch (err) {
      console.error(`❌ Expiry handling failed for ${sub._id}`, err);
    }
  }

  console.log(`
🔔 Token expiry job completed.
⚠️ Expiry warnings sent: ${expiryWarnCount}
🔥 Token warnings sent:  ${tokenWarnCount}
💀 Subscriptions expired: ${expiredCount}
  `);
};

export const startTokenExpiryJob = () => {
  cron.schedule('0 9 * * *', runTokenExpiryJob); // daily 9 AM
  console.log('🕘 Token expiry cron job scheduled (daily at 9AM)');
};
