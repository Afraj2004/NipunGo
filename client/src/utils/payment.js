import axios from './axios';

// Opens Razorpay's payment window for a booking and records the result on our server.
//
// Resolves (never throws) with { status, message? }:
//   'paid'      - paid and verified by the server
//   'cancelled' - the customer closed the window
//   'failed'    - could not start, or the server could not verify it
//
// Declined cards etc. are handled inside Razorpay's own window (the customer can retry there),
// so we only resolve once they pay or close it.
export const payForBooking = async (bookingId, user = {}) => {
  let order;
  try {
    const res = await axios.post('/payment/create-order', { bookingId });
    order = res.data;
  } catch (err) {
    return { status: 'failed', message: err.response?.data?.message || 'Payment shuru nahi ho paya.' };
  }

  if (typeof window === 'undefined' || !window.Razorpay) {
    return { status: 'failed', message: 'Payment window load nahi hui. Internet check karke dobara try karo.' };
  }

  return new Promise((resolve) => {
    const checkout = new window.Razorpay({
      key: order.key,
      amount: order.order.amount,
      currency: order.order.currency,
      order_id: order.order.id,
      name: 'NipunGo',
      description: 'Home service payment',
      prefill: { name: user.name, email: user.email },
      theme: { color: '#2549C4' },
      handler: async (response) => {
        try {
          await axios.post('/payment/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          resolve({ status: 'paid' });
        } catch (err) {
          resolve({
            status: 'failed',
            message: err.response?.data?.message || 'Payment verify nahi ho paya. Paise kate hain to support se baat karo.',
          });
        }
      },
      modal: { ondismiss: () => resolve({ status: 'cancelled' }) },
    });
    checkout.open();
  });
};
