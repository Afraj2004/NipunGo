import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Track, { buildSteps } from './Track';
import axios from '../utils/axios';

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
const worker = { name: 'Ravi Kumar', service: 'Plumber', city: 'Pune', rating: 4.5, phone: '9876543210' };

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

  test('a fresh request has only the first stage done', () => {
    expect(buildSteps(base).map((s) => s.done)).toEqual([true, false, false, false, false]);
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

  test('confirmed: shows the START code, the worker, and a call link', async () => {
    show({ ...base, status: 'Confirmed', acceptedAt: '2027-01-01T09:00:00Z', assignedWorker: worker, otps: { start: '4821' } });
    expect(await screen.findByText('4821')).toBeInTheDocument();
    expect(screen.getByText(/START code/)).toBeInTheDocument();
    expect(screen.queryByText(/END code/)).toBeNull();
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByText(/Call/).closest('a')).toHaveAttribute('href', 'tel:9876543210');
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
    expect(screen.getByText(/END code/)).toBeInTheDocument();
    expect(screen.queryByText(/START code/)).toBeNull();
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
