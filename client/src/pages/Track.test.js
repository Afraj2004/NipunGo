import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Track, { buildSteps } from './Track';
import axios from '../utils/axios';
import { payForBooking } from '../utils/payment';

const mockNavigate = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ bookingId: 'b1' }),
    Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock('../utils/payment', () => ({ payForBooking: jest.fn() }));

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

const base = {
  _id: 'b1a2b3c4d5e6f7',
  service: 'Plumber',
  date: '2027-01-05',
  time: '10:00 AM',
  address: '12 MG Road, Pune - 411001',
  price: 250,
  status: 'Searching',
  createdAt: '2027-01-01T08:00:00Z',
};
const worker = { name: 'Ravi Kumar', service: 'Plumber', city: 'Pune', rating: 4.5 };

const show = (booking) => {
  axios.get.mockResolvedValue({ data: { booking } });
  return render(<Track />);
};

beforeEach(() => {
  window.confirm = jest.fn(() => true);
});

describe('buildSteps', () => {
  test('marks only the stages that actually happened', () => {
    const steps = buildSteps({ ...base, acceptedAt: '2027-01-01T09:00:00Z', onTheWayAt: '2027-01-05T09:00:00Z' });
    expect(steps.map((s) => s.done)).toEqual([true, true, true, false, false]);
  });

  test('if the job has started the worker must have arrived, even without tapping "on the way"', () => {
    const steps = buildSteps({ ...base, acceptedAt: '2027-01-01T09:00:00Z', startedAt: '2027-01-05T10:05:00Z' });
    expect(steps.map((s) => s.done)).toEqual([true, true, true, true, false]);
  });

  test('a fresh request has only the first stage done', () => {
    expect(buildSteps(base).map((s) => s.done)).toEqual([true, false, false, false, false]);
  });
});

describe('payment at the end of the service', () => {
  const completed = {
    ...base,
    status: 'Completed',
    acceptedAt: '2027-01-01T09:00:00Z',
    startedAt: '2027-01-05T10:05:00Z',
    completedAt: '2027-01-05T11:00:00Z',
    assignedWorker: worker,
    paymentStatus: 'pending',
  };

  test('a finished, unpaid job shows the amount due, with online payment and the cash route', async () => {
    show(completed);
    expect(await screen.findByText(/Payment baaki hai/)).toBeInTheDocument();
    expect(screen.getAllByText('₹250').length).toBeGreaterThan(0);
    expect(screen.getByText(/Online pay karo/)).toBeInTheDocument();
    expect(screen.getByText(/Worker ko ₹250 do/)).toBeInTheDocument();
    // the customer cannot mark cash as received: only the worker can
    expect(screen.queryByText(/cash mil gaya/i)).toBeNull();
  });

  test('paying online opens the payment window for this booking, then refreshes', async () => {
    show(completed);
    payForBooking.mockResolvedValue({ status: 'paid' });
    fireEvent.click(await screen.findByText(/Online pay karo/));
    await waitFor(() => expect(payForBooking).toHaveBeenCalledWith('b1', expect.any(Object)));
    await waitFor(() => expect(axios.get.mock.calls.length).toBeGreaterThanOrEqual(2));
  });

  test('a failed payment shows why and keeps the button available to retry', async () => {
    show(completed);
    payForBooking.mockResolvedValue({ status: 'failed', message: 'Payment verify nahi ho paya.' });
    fireEvent.click(await screen.findByText(/Online pay karo/));
    expect(await screen.findByText(/Payment verify nahi ho paya/)).toBeInTheDocument();
    expect(screen.getByText(/Online pay karo/)).toBeEnabled();
  });

  test('closing the payment window is not an error', async () => {
    show(completed);
    payForBooking.mockResolvedValue({ status: 'cancelled' });
    fireEvent.click(await screen.findByText(/Online pay karo/));
    await waitFor(() => expect(payForBooking).toHaveBeenCalled());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('once paid it shows a receipt and no pay button', async () => {
    show({ ...completed, paymentStatus: 'paid', paidVia: 'cash', paidAmount: 250, paidAt: '2027-01-05T11:30:00Z' });
    expect(await screen.findByText(/Payment ho gaya: ₹250/)).toBeInTheDocument();
    expect(screen.getByText(/Cash se/)).toBeInTheDocument();
    expect(screen.queryByText(/Online pay karo/)).toBeNull();
  });

  test('before the service the payment card is a quiet option, not a demand', async () => {
    show({ ...base, status: 'Confirmed', acceptedAt: '2027-01-01T09:00:00Z', assignedWorker: worker, otps: { start: '4821' }, paymentStatus: 'pending' });
    expect(await screen.findByText('Payment')).toBeInTheDocument();
    expect(screen.queryByText(/Payment baaki hai/)).toBeNull();
    expect(screen.getByText(/kaam poora hone ke baad hota hai/i)).toBeInTheDocument();
  });

  test('a paid booking cannot be cancelled online (refunds go through support)', async () => {
    show({ ...base, status: 'Confirmed', acceptedAt: '2027-01-01T09:00:00Z', assignedWorker: worker, otps: { start: '4821' }, paymentStatus: 'paid', paidVia: 'online', paidAmount: 250 });
    await screen.findByText(/Payment ho gaya/);
    expect(screen.queryByText(/Booking cancel karo/)).toBeNull();
    expect(screen.getByText(/Cancel \/ refund ke liye/)).toBeInTheDocument();
  });
});

describe('Track page', () => {
  test('searching: shows progress and no code', async () => {
    show(base);
    expect(await screen.findByText('Request bheji gayi')).toBeInTheDocument();
    expect(screen.getByText(/Paas ke workers ko request gayi hai/)).toBeInTheDocument();
    expect(screen.queryByText(/START code/)).toBeNull();
    expect(screen.getByText(/Booking cancel karo/)).toBeInTheDocument();
  });

  test('confirmed: shows the START code and the worker, with no phone number or call button', async () => {
    show({ ...base, status: 'Confirmed', acceptedAt: '2027-01-01T09:00:00Z', assignedWorker: worker, otps: { start: '4821' } });
    expect(await screen.findByText('4821')).toBeInTheDocument();
    expect(screen.getByText(/START code/)).toBeInTheDocument();
    expect(screen.queryByText(/END code/)).toBeNull();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.queryByText(/Call/)).toBeNull();
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
    expect(screen.getByText(/phone numbers share nahi hote/i)).toBeInTheDocument();
  });

  test('in progress: shows the END code instead, and cancelling is no longer offered', async () => {
    show({
      ...base,
      status: 'In Progress',
      acceptedAt: '2027-01-01T09:00:00Z',
      startedAt: '2027-01-05T10:05:00Z',
      assignedWorker: worker,
      otps: { end: '7305' },
    });
    expect(await screen.findByText('7305')).toBeInTheDocument();
    expect(screen.getByText('END code')).toBeInTheDocument(); // the code card heading
    expect(screen.queryByText('START code')).toBeNull();
    expect(screen.queryByText(/Booking cancel karo/)).toBeNull();
  });

  test('completed: no code, but review and rebook are offered', async () => {
    show({
      ...base,
      status: 'Completed',
      acceptedAt: '2027-01-01T09:00:00Z',
      startedAt: '2027-01-05T10:05:00Z',
      completedAt: '2027-01-05T11:00:00Z',
      assignedWorker: worker,
    });
    fireEvent.click(await screen.findByText(/Review do/));
    expect(mockNavigate).toHaveBeenCalledWith('/review/b1a2b3c4d5e6f7');
    fireEvent.click(screen.getByText(/Dobara book karo/));
    expect(mockNavigate).toHaveBeenCalledWith('/booking/Plumber');
    expect(screen.queryByText(/START code|END code/)).toBeNull();
  });

  test('cancelled: shows a banner instead of the progress steps', async () => {
    show({ ...base, status: 'Cancelled', cancelledAt: '2027-01-02T08:00:00Z' });
    expect(await screen.findByText(/Ye booking cancel ho gayi/)).toBeInTheDocument();
    expect(screen.queryByText('Progress')).toBeNull();
  });

  test('cancel asks first, then cancels and refreshes', async () => {
    show(base);
    axios.put.mockResolvedValue({ data: { success: true } });
    fireEvent.click(await screen.findByText(/Booking cancel karo/));
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/booking/cancel/b1', {}));
    expect(axios.get.mock.calls.length).toBeGreaterThanOrEqual(2); // reloaded after cancelling
  });

  test('declining the confirmation cancels nothing', async () => {
    show(base);
    window.confirm = jest.fn(() => false);
    fireEvent.click(await screen.findByText(/Booking cancel karo/));
    expect(axios.put).not.toHaveBeenCalled();
  });

  test("someone else's booking shows a clear message instead of a broken page", async () => {
    axios.get.mockRejectedValue({ response: { status: 403 } });
    render(<Track />);
    expect(await screen.findByText(/nahi mili ya aapki nahi hai/)).toBeInTheDocument();
  });
});
