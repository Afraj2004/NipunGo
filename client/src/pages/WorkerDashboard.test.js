import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkerDashboard from './WorkerDashboard';
import axios from '../utils/axios';

// must be one stable function: the dashboard re-runs its load effect if navigate changes
const mockNavigate = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
    Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const job = {
  _id: 'b1',
  service: 'Plumber',
  date: '2027-01-05',
  time: '10:00 AM',
  address: '12 MG Road, Pune - 411001',
  price: 250,
  status: 'Confirmed',
  customer: { name: 'Asha Rao', phone: '9876543210', email: 'asha@example.com' },
};

const setup = (booking = job) => {
  localStorage.setItem('token', 't');
  localStorage.setItem('user', JSON.stringify({ id: 'w1', name: 'Ravi Kumar', role: 'worker' }));
  axios.get.mockImplementation(async (url) => {
    if (url.startsWith('/booking/worker-requests/')) return { data: { success: true, requests: [] } };
    if (url.startsWith('/booking/worker-bookings/')) return { data: { success: true, bookings: [booking] } };
    return {
      data: {
        success: true,
        worker: { _id: 'w1', name: 'Ravi Kumar', service: 'Plumber', city: 'Pune', isAvailable: true },
      },
    };
  });
};

const openMyBookings = async () => {
  render(<WorkerDashboard />);
  fireEvent.click(await screen.findByText(/My Bookings/));
};

const enterCode = (code) =>
  fireEvent.change(screen.getByLabelText(/4 digit code/i), { target: { value: code } });

beforeEach(() => localStorage.clear());

test('a confirmed job offers "On the way" and "Start service", not "complete"', async () => {
  setup();
  await openMyBookings();
  expect(await screen.findByText(/On the way/)).toBeInTheDocument();
  expect(screen.getByText(/Start service/)).toBeInTheDocument();
  expect(screen.queryByText(/Mark as Complete/)).toBeNull();
});

test('"On the way" tells the server and then shows it was sent', async () => {
  setup();
  axios.put.mockResolvedValue({ data: { success: true, booking: { onTheWayAt: '2027-01-05T09:00:00Z' } } });
  await openMyBookings();
  fireEvent.click(await screen.findByText(/On the way/));
  await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/booking/on-the-way/b1', {}));
  expect(await screen.findByText(/Customer ko bata diya/)).toBeInTheDocument();
});

test('starting needs the customer\'s 4-digit code, then the job is In Progress', async () => {
  setup();
  axios.post.mockResolvedValue({ data: { success: true, booking: { status: 'In Progress', startedAt: '2027-01-05T10:05:00Z' } } });
  await openMyBookings();

  fireEvent.click(await screen.findByText(/Start service/));
  const confirm = screen.getByText('Confirm');
  expect(confirm).toBeDisabled(); // no code yet

  enterCode('48a21'); // letters are dropped, max 4 digits
  expect(screen.getByLabelText(/4 digit code/i).value).toBe('4821');
  fireEvent.click(screen.getByText('Confirm'));

  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/booking/start/b1', { otp: '4821' }));
  expect(await screen.findByText(/Finish service/)).toBeInTheDocument();
  expect(screen.queryByText(/Start service/)).toBeNull();
});

test('a wrong code shows the server message, clears the box and keeps the dialog open', async () => {
  setup();
  axios.post.mockRejectedValue({ response: { data: { message: 'OTP galat hai! 4 attempt bache hain.' } } });
  await openMyBookings();

  fireEvent.click(await screen.findByText(/Start service/));
  enterCode('0000');
  fireEvent.click(screen.getByText('Confirm'));

  expect(await screen.findByText(/OTP galat hai/)).toBeInTheDocument();
  expect(screen.getByLabelText(/4 digit code/i).value).toBe('');
  expect(screen.getByText(/Kaam shuru karo/)).toBeInTheDocument(); // dialog still open
});

test('finishing needs the END code and completes the job', async () => {
  setup({ ...job, status: 'In Progress', startedAt: '2027-01-05T10:05:00Z' });
  window.alert = jest.fn();
  axios.post.mockResolvedValue({ data: { success: true, booking: { status: 'Completed', completedAt: '2027-01-05T11:00:00Z' } } });
  await openMyBookings();

  fireEvent.click(await screen.findByText(/Finish service/));
  expect(screen.getByText('END')).toBeInTheDocument();
  enterCode('7305');
  fireEvent.click(screen.getByText('Confirm'));

  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/booking/end/b1', { otp: '7305' }));
  expect(await screen.findByText(/Kaam complete ho gaya/)).toBeInTheDocument();
  // the job now waits for payment: cash can be confirmed
  expect(screen.getByText(/cash mil gaya/)).toBeInTheDocument();
});

test('Cancel closes the dialog without calling the server', async () => {
  setup();
  await openMyBookings();
  fireEvent.click(await screen.findByText(/Start service/));
  fireEvent.click(screen.getByText('Cancel'));
  expect(screen.queryByText(/Kaam shuru karo/)).toBeNull();
  expect(axios.post).not.toHaveBeenCalled();
});

describe('privacy and payment on the worker side', () => {
  const finished = {
    ...job,
    status: 'Completed',
    startedAt: '2027-01-05T10:05:00Z',
    completedAt: '2027-01-05T11:00:00Z',
    paymentStatus: 'pending',
  };

  test("a job card never shows the customer's phone or email", async () => {
    setup({ ...job, customer: { name: 'Asha R.' } });
    await openMyBookings();
    expect(await screen.findByText(/Asha R\./)).toBeInTheDocument();
    // a Call button, but no number anywhere until it is pressed
    expect(screen.getByRole('button', { name: /Call karo/ })).toBeInTheDocument();
    expect(document.querySelector('a[href^="tel:"]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/9876543210|@example\.com/);
  });

  test('a finished, unpaid job offers "cash mil gaya" and records it after confirming', async () => {
    setup(finished);
    window.confirm = jest.fn(() => true);
    axios.put.mockResolvedValue({
      data: { success: true, booking: { paymentStatus: 'paid', paidVia: 'cash', paidAmount: 250, paidAt: '2027-01-05T11:30:00Z' } },
    });
    await openMyBookings();

    fireEvent.click(await screen.findByText(/₹250 cash mil gaya/));
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/booking/cash-received/b1', {}));
    expect(await screen.findByText(/₹250 paid/)).toBeInTheDocument();
    expect(screen.queryByText(/cash mil gaya/)).toBeNull();
  });

  test('declining the confirmation records nothing', async () => {
    setup(finished);
    window.confirm = jest.fn(() => false);
    await openMyBookings();
    fireEvent.click(await screen.findByText(/cash mil gaya/));
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('a job the customer already paid online shows as paid with no cash button', async () => {
    setup({ ...finished, paymentStatus: 'paid', paidVia: 'online', paidAmount: 250 });
    await openMyBookings();
    expect(await screen.findByText(/₹250 paid/)).toBeInTheDocument();
    expect(screen.getByText(/\(online\)/)).toBeInTheDocument();
    expect(screen.queryByText(/cash mil gaya/)).toBeNull();
  });

  test('an open request shows only the area (the server masked the street address)', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', JSON.stringify({ id: 'w1', name: 'Ravi Kumar', role: 'worker' }));
    axios.get.mockImplementation(async (url) => {
      if (url.startsWith('/booking/worker-requests/')) {
        return { data: { success: true, requests: [{ ...job, _id: 'r1', status: 'Searching', customer: { name: 'Asha R.' }, address: 'Pune - 411001 area (poora address accept karne ke baad)' }] } };
      }
      if (url.startsWith('/booking/worker-bookings/')) return { data: { success: true, bookings: [] } };
      return { data: { success: true, worker: { _id: 'w1', name: 'Ravi Kumar', service: 'Plumber', city: 'Pune', isAvailable: true } } };
    });
    render(<WorkerDashboard />);
    expect(await screen.findByText(/Pune - 411001 area/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/MG Road/);
    expect(document.body.textContent).not.toMatch(/@example\.com/);
  });
});
