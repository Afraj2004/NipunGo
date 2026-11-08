import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Dashboard from './Dashboard';
import axios from '../utils/axios';

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
  default: { get: jest.fn(), put: jest.fn(), post: jest.fn() },
}));

const base = { date: '2027-01-05', time: '10:00 AM', address: '12 MG Road, Pune - 411001', price: 250, service: 'Plumber' };
const searching = { ...base, _id: 's1', status: 'Searching', workersNotified: 3 };
const confirmed = { ...base, _id: 'c1', status: 'Confirmed', assignedWorker: { name: 'Ravi Kumar', rating: 4.5 }, paymentStatus: 'pending' };
const unpaid = { ...base, _id: 'u1', status: 'Completed', service: 'Electrician', price: 300, assignedWorker: { name: 'Sunil V' }, paymentStatus: 'pending' };
// made before payments existed: has no paymentStatus at all
const legacy = { ...base, _id: 'l1', status: 'Completed', service: 'Cleaner', price: 150 };
const paid = { ...base, _id: 'p1', status: 'Completed', service: 'Painter', price: 400, paymentStatus: 'paid', paidVia: 'cash', paidAmount: 400 };
const cancelled = { ...base, _id: 'x1', status: 'Cancelled', service: 'Gardener' };

const setup = (bookings, suggestions = []) => {
  localStorage.setItem('token', 't');
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Asha Rao', role: 'customer' }));
  axios.get.mockImplementation(async (url) => {
    if (url.startsWith('/booking/my-bookings/')) return { data: { success: true, bookings } };
    if (url === '/recommendations/suggested') return { data: { recommendations: suggestions } };
    return { data: {} };
  });
};

beforeEach(() => {
  localStorage.clear();
  window.confirm = jest.fn(() => true);
});

test('greets the customer and shows the numbers that matter', async () => {
  setup([searching, confirmed, unpaid, paid]);
  render(<Dashboard />);
  expect(await screen.findByText('Namaste, Asha')).toBeInTheDocument();
  await screen.findAllByRole('listitem');
  expect(screen.getByText('Total bookings').previousSibling).toHaveTextContent('4');
  expect(screen.getByText('Active', { selector: 'p' }).previousSibling).toHaveTextContent('2'); // (the tab is also called Active)
  expect(screen.getByText('Total paid').previousSibling).toHaveTextContent('₹400'); // only what was actually paid
});

test('money owed is shown first, with a way to pay', async () => {
  setup([confirmed, unpaid]);
  render(<Dashboard />);
  expect(await screen.findByText('Ek booking ka payment baaki hai')).toBeInTheDocument();
  expect(screen.getByText(/Kul ₹300/)).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole('button', { name: 'Payment karo' })[0]);
  expect(mockNavigate).toHaveBeenCalledWith('/track/u1');
});

test('an older booking with no payment field counts as unpaid, not as broken', async () => {
  setup([legacy]);
  render(<Dashboard />);
  expect(await screen.findByText('Payment baaki')).toBeInTheDocument();
  expect(screen.getByText('Ek booking ka payment baaki hai')).toBeInTheDocument();
});

test('a paid booking shows Paid and no payment prompt', async () => {
  setup([paid]);
  render(<Dashboard />);
  expect(await screen.findByText(/Paid · cash/)).toBeInTheDocument();
  expect(screen.queryByText(/payment baaki hai/i)).toBeNull();
});

test('each state offers the right actions', async () => {
  setup([searching, confirmed, paid, cancelled]);
  render(<Dashboard />);
  await screen.findAllByRole('listitem'); // wait until the bookings have loaded
  const card = (label) => screen.getByRole('button', { name: new RegExp(`^${label} booking`) }).closest('li');
  const confirmedCard = screen.getAllByRole('listitem').find((c) => within(c).queryByText(/Ravi Kumar/));

  // searching: track + cancel, nobody to call yet
  const searchingCard = screen.getAllByRole('listitem').find((c) => within(c).queryByText(/3 workers ko request/));
  expect(within(searchingCard).getByRole('button', { name: /Track karo/ })).toBeInTheDocument();
  expect(within(searchingCard).getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
  expect(within(searchingCard).queryByRole('button', { name: /Call karo/ })).toBeNull();

  // confirmed: a worker is assigned, so a Call button appears
  expect(within(confirmedCard).getByRole('button', { name: /Call karo/ })).toBeInTheDocument();

  // finished and paid: review + rebook, no cancel, no call
  const paidCard = card('Painter');
  expect(within(paidCard).getByRole('button', { name: /Review do/ })).toBeInTheDocument();
  expect(within(paidCard).getByRole('button', { name: /Dobara book karo/ })).toBeInTheDocument();
  expect(within(paidCard).queryByRole('button', { name: /Cancel/ })).toBeNull();
  expect(within(paidCard).queryByRole('button', { name: /Call karo/ })).toBeNull();

  // cancelled: only rebook
  expect(within(card('Gardener')).getByRole('button', { name: /Dobara book karo/ })).toBeInTheDocument();
});

test('finished but unpaid: can still call (to sort the payment) and pay', async () => {
  setup([unpaid]);
  render(<Dashboard />);
  await screen.findAllByRole('listitem'); // wait until the bookings have loaded
  const c = screen.getAllByRole('listitem')[0];
  expect(within(c).getByRole('button', { name: /Call karo/ })).toBeInTheDocument();
  expect(within(c).getByRole('button', { name: /Payment karo/ })).toBeInTheDocument();
});

test('workers notified is shown as a count, with no worker details', async () => {
  setup([searching]);
  render(<Dashboard />);
  expect(await screen.findByText(/3 workers ko request bheji gayi hai/)).toBeInTheDocument();
});

test('opening a booking goes to its tracking page', async () => {
  setup([confirmed]);
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole('button', { name: /Plumber booking/ }));
  expect(mockNavigate).toHaveBeenCalledWith('/track/c1');
});

test('cancel asks first, then cancels and refreshes the list', async () => {
  setup([searching]);
  axios.put.mockResolvedValue({ data: { success: true } });
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/booking/cancel/s1', {}));
  const loads = axios.get.mock.calls.filter(([u]) => u.startsWith('/booking/my-bookings/')).length;
  expect(loads).toBeGreaterThanOrEqual(2);
});

test('declining the cancel confirmation does nothing', async () => {
  setup([searching]);
  window.confirm = jest.fn(() => false);
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
  expect(axios.put).not.toHaveBeenCalled();
});

test('a booking the server refuses to cancel shows why', async () => {
  setup([searching]);
  axios.put.mockRejectedValue({ response: { data: { message: 'Payment ho chuki hai. Cancel / refund ke liye support se baat karo.' } } });
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/support se baat karo/);
});

test('the filter tabs narrow the list', async () => {
  setup([searching, confirmed, unpaid, paid, cancelled]);
  render(<Dashboard />);
  await screen.findAllByRole('listitem'); // wait until the bookings have loaded
  expect(screen.getAllByRole('listitem')).toHaveLength(5);

  fireEvent.click(screen.getByRole('tab', { name: /Active/ }));
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  fireEvent.click(screen.getByRole('tab', { name: /Completed/ }));
  expect(screen.getAllByRole('listitem')).toHaveLength(2);
  fireEvent.click(screen.getByRole('tab', { name: /Cancelled/ }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
});

test('no bookings: a friendly empty state with a way to start', async () => {
  setup([]);
  render(<Dashboard />);
  expect(await screen.findByText('Abhi koi booking nahi hai')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Service chuno/ }));
  expect(mockNavigate).toHaveBeenCalledWith('/services');
});

test('suggested services let you rebook in one tap', async () => {
  setup([confirmed], ['Cleaner', 'Electrician']);
  render(<Dashboard />);
  fireEvent.click(await screen.findByRole('button', { name: 'Cleaner' }));
  expect(mockNavigate).toHaveBeenCalledWith('/booking/Cleaner');
});

test('a failed load shows an error instead of a blank page', async () => {
  localStorage.setItem('token', 't');
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Asha Rao', role: 'customer' }));
  axios.get.mockImplementation(async (url) => {
    if (url.startsWith('/booking/my-bookings/')) throw { response: { data: { message: 'Server Error!' } } };
    return { data: { recommendations: [] } };
  });
  render(<Dashboard />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/Server Error/);
});
