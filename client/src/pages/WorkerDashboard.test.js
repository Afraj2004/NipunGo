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
  expect(await screen.findByText(/✅ Completed/)).toBeInTheDocument();
});

test('Cancel closes the dialog without calling the server', async () => {
  setup();
  await openMyBookings();
  fireEvent.click(await screen.findByText(/Start service/));
  fireEvent.click(screen.getByText('Cancel'));
  expect(screen.queryByText(/Kaam shuru karo/)).toBeNull();
  expect(axios.post).not.toHaveBeenCalled();
});
