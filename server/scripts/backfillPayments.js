// One-off, safe to run again: gives bookings made before online payments existed the payment
// fields they are missing (unpaid, cash). It never touches a booking that already has them.
//
//   node scripts/backfillPayments.js

require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const bookings = mongoose.connection.db.collection('bookings');

  const res = await bookings.updateMany(
    { paymentStatus: { $exists: false } },
    { $set: { paymentStatus: 'pending', paymentMethod: 'cash', paidVia: null, paidAt: null, paidAmount: 0 } }
  );
  console.log(`Updated ${res.modifiedCount} booking(s) in database "${mongoose.connection.name}".`);
  process.exit(0);
})().catch((e) => { console.error('Failed:', e.message); process.exit(1); });
