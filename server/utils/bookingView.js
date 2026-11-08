// What each person may see of a booking.
//
//  - the customer sees their booking, the worker's name/photo/rating, but never the
//    worker's phone or email
//  - a worker sees the customer's first name + last initial, never phone or email, and only
//    the area (not the full address) until they have accepted the job
//  - nobody but an admin sees internal fields (OTP lock-outs, payment ids, other workers)
//
// Phone numbers and emails therefore never leave the server except to an admin.

const shortName = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Customer';
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
};

// "12 MG Road, Flat 4B, Pune - 411001"  ->  "Pune - 411001 area"
const maskAddress = (address) => {
  const segments = String(address || '').split(',').map((s) => s.trim()).filter(Boolean);
  return segments.length > 1
    ? `${segments[segments.length - 1]} area (poora address accept karne ke baad)`
    : 'Poora address accept karne ke baad dikhega';
};

const idOf = (value) => String(value?._id || value || '');

const present = (booking, viewer) => {
  const b = typeof booking.toObject === 'function' ? booking.toObject() : { ...booking };
  if (viewer.role === 'admin') return b;

  const viewerId = String(viewer.id || viewer._id);
  const isCustomer = idOf(b.customer) === viewerId;
  const out = { ...b };

  const notified = (b.pendingWorkers || []).length;
  ['pendingWorkers', 'rejectedWorkers', 'otpFailures', 'otpLockedUntil',
   'razorpayOrderId', 'razorpayPaymentId', '__v'].forEach((k) => delete out[k]);
  if (isCustomer) out.workersNotified = notified;

  // populated customer: name only (shortened for the worker)
  if (out.customer && out.customer.name !== undefined) {
    out.customer = {
      _id: out.customer._id,
      name: isCustomer ? out.customer.name : shortName(out.customer.name),
    };
  }
  // populated worker: never phone / email
  if (out.assignedWorker && out.assignedWorker.name !== undefined) {
    const { phone, email, ...safeWorker } = out.assignedWorker; // eslint-disable-line no-unused-vars
    out.assignedWorker = safeWorker;
  }
  if (!isCustomer && out.status === 'Searching') out.address = maskAddress(out.address);
  return out;
};

module.exports = { present, shortName, maskAddress };
