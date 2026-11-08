import { payForBooking } from './payment';
import axios from './axios';

jest.mock('./axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const ORDER = { data: { key: 'rzp_test_x', order: { id: 'order_1', amount: 23000, currency: 'INR' } } };

// A stand-in for Razorpay's window: tests decide how the customer behaves
const fakeRazorpay = (behaviour) => {
  window.Razorpay = function Razorpay(options) {
    this.open = () => behaviour(options);
  };
};

afterEach(() => { delete window.Razorpay; });

test('asks the server for an order for this booking only (no amount from the browser)', async () => {
  axios.post.mockResolvedValueOnce(ORDER);
  fakeRazorpay((o) => o.modal.ondismiss());
  await payForBooking('b1', { name: 'Asha' });
  expect(axios.post).toHaveBeenCalledWith('/payment/create-order', { bookingId: 'b1' });
});

test('opens the window with the server order and the customer name', async () => {
  axios.post.mockResolvedValueOnce(ORDER);
  let seen;
  fakeRazorpay((o) => { seen = o; o.modal.ondismiss(); });
  await payForBooking('b1', { name: 'Asha', email: 'a@example.com' });
  expect(seen).toMatchObject({ key: 'rzp_test_x', order_id: 'order_1', amount: 23000, currency: 'INR', prefill: { name: 'Asha', email: 'a@example.com' } });
});

test('a successful payment is verified by the server before it counts', async () => {
  axios.post.mockResolvedValueOnce(ORDER).mockResolvedValueOnce({ data: { success: true } });
  fakeRazorpay((o) => o.handler({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig' }));
  const result = await payForBooking('b1');
  expect(axios.post).toHaveBeenLastCalledWith('/payment/verify', {
    razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig',
  });
  expect(result).toEqual({ status: 'paid' });
});

test('if the server cannot verify, it is reported as failed with a message', async () => {
  axios.post.mockResolvedValueOnce(ORDER).mockRejectedValueOnce({ response: { data: { message: 'Payment verify nahi ho paya!' } } });
  fakeRazorpay((o) => o.handler({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'bad' }));
  const result = await payForBooking('b1');
  expect(result).toEqual({ status: 'failed', message: 'Payment verify nahi ho paya!' });
});

test('closing the window is "cancelled", not a failure', async () => {
  axios.post.mockResolvedValueOnce(ORDER);
  fakeRazorpay((o) => o.modal.ondismiss());
  expect(await payForBooking('b1')).toEqual({ status: 'cancelled' });
});

test('if the order cannot be created the server message is returned and no window opens', async () => {
  axios.post.mockRejectedValueOnce({ response: { data: { message: 'Is booking ka payment ho chuka hai!' } } });
  const open = jest.fn();
  window.Razorpay = function Razorpay() { this.open = open; };
  const result = await payForBooking('b1');
  expect(result).toEqual({ status: 'failed', message: 'Is booking ka payment ho chuka hai!' });
  expect(open).not.toHaveBeenCalled();
});

test('if the payment script did not load, the customer is told to retry', async () => {
  axios.post.mockResolvedValueOnce(ORDER);
  const result = await payForBooking('b1');
  expect(result.status).toBe('failed');
  expect(result.message).toMatch(/Payment window load nahi hui/);
});
