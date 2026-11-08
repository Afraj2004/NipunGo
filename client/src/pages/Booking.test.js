import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import Booking from './Booking';
import axios from '../utils/axios';
import { payForBooking } from '../utils/payment';

const mockNavigate = jest.fn();
let mockService = 'Gardener';

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
    useParams: () => ({ serviceName: mockService }),
    Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../utils/payment', () => ({ payForBooking: jest.fn() }));

const HOME = { _id: 'a1', label: 'Home', full: '12 MG Road, Flat 4B, Pune - 411001', isDefault: true };
const WORK = { _id: 'a2', label: 'Work', full: '5 Tech Park, Pune - 411057', isDefault: false };

// Saturday 7 Nov 2026, 10:30 in India
const NOW = new Date('2026-11-07T10:30:00+05:30');

const mockApi = ({ addresses = [HOME, WORK], availability = { Gardener: 2 } } = {}) => {
  axios.get.mockImplementation(async (url) => {
    if (url === '/user/addresses') return { data: { addresses } };
    if (url === '/worker/availability') return { data: { availability } };
    return { data: {} };
  });
};

beforeEach(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(NOW);
  mockService = 'Gardener';
  sessionStorage.clear();
  localStorage.setItem('token', 't');
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Asha Rao', email: 'asha@example.com', role: 'customer' }));
  mockApi();
});

afterEach(() => {
  jest.useRealTimers();
});

const dateChip = (label) => screen.getByRole('radio', { name: new RegExp(`^${label}`) });
const slotNames = () => within(screen.getByRole('radiogroup', { name: 'Time slot' })).getAllByRole('radio').map((b) => b.textContent);
const confirmButton = () => screen.getByRole('button', { name: /Confirm/ });

test('today only offers times that are still ahead (10:30 now: no 9 or 10 AM)', async () => {
  render(<Booking />);
  fireEvent.click(await screen.findByRole('radio', { name: /^Aaj/ }));
  const slots = slotNames();
  expect(slots).toEqual(['11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM']);
  expect(slots).not.toContain('09:00 AM');
  expect(slots).not.toContain('10:00 AM');
});

test("tomorrow offers the full day, and you can't pick a date before today", async () => {
  render(<Booking />);
  fireEvent.click(await screen.findByRole('radio', { name: /^Kal/ }));
  expect(slotNames()).toHaveLength(7);
  const picker = screen.getByLabelText('Pick another date');
  expect(picker).toHaveAttribute('min', '2026-11-07');
  expect(picker).toHaveAttribute('max', '2027-01-06');
});

test('late in the evening "Aaj" is not offered at all', async () => {
  jest.setSystemTime(new Date('2026-11-07T18:00:00+05:30'));
  render(<Booking />);
  await screen.findByRole('radio', { name: /^Kal/ });
  expect(screen.queryByRole('radio', { name: /^Aaj/ })).toBeNull();
});

test('the default saved address is selected already, so there is nothing to type', async () => {
  render(<Booking />);
  await waitFor(() => expect(screen.getByRole('radio', { name: /Home/ })).toHaveAttribute('aria-checked', 'true'));
  expect(screen.getAllByText(HOME.full).length).toBeGreaterThan(0);
  // only the date and time are left
  expect(confirmButton()).toBeDisabled();
  expect(screen.getByText('Pehle date chuno')).toBeInTheDocument();
});

test('the confirm button waits for a date and a time, then books with the saved address', async () => {
  axios.post.mockResolvedValue({ data: { success: true, booking: { _id: 'b1' } } });
  render(<Booking />);
  fireEvent.click(await screen.findByRole('radio', { name: /^Kal/ }));
  expect(confirmButton()).toBeDisabled();
  expect(screen.getByText('Ab time chuno')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('radio', { name: '10:00 AM' }));
  await waitFor(() => expect(confirmButton()).toBeEnabled());
  fireEvent.click(confirmButton());

  await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/booking/create', {
    service: 'Gardener',
    date: '2026-11-08',
    time: '10:00 AM',
    address: HOME.full,
    description: '',
    paymentMethod: 'cash',
  }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/track/b1'));
  expect(payForBooking).not.toHaveBeenCalled(); // pay-after-service: no payment window
});

test('another saved address can be chosen with one tap', async () => {
  axios.post.mockResolvedValue({ data: { success: true, booking: { _id: 'b1' } } });
  render(<Booking />);
  fireEvent.click(await screen.findByRole('radio', { name: /Work/ }));
  fireEvent.click(screen.getByRole('radio', { name: /^Kal/ }));
  fireEvent.click(screen.getByRole('radio', { name: '02:00 PM' }));
  fireEvent.click(confirmButton());
  await waitFor(() => expect(axios.post.mock.calls[0][1].address).toBe(WORK.full));
});

test('the note is sent along', async () => {
  axios.post.mockResolvedValue({ data: { success: true, booking: { _id: 'b1' } } });
  render(<Booking />);
  fireEvent.change(await screen.findByLabelText(/Koi extra detail/), { target: { value: 'gate pe guard hai' } });
  fireEvent.click(screen.getByRole('radio', { name: /^Kal/ }));
  fireEvent.click(screen.getByRole('radio', { name: '11:00 AM' }));
  fireEvent.click(confirmButton());
  await waitFor(() => expect(axios.post.mock.calls[0][1].description).toBe('gate pe guard hai'));
});

test('"pay now" opens the payment window for the new booking, then goes to tracking either way', async () => {
  axios.post.mockResolvedValue({ data: { success: true, booking: { _id: 'b9' } } });
  payForBooking.mockResolvedValue({ status: 'cancelled' }); // they closed the window: booking still stands
  render(<Booking />);
  fireEvent.click(await screen.findByRole('radio', { name: /Abhi online pay karo/ }));
  fireEvent.click(screen.getByRole('radio', { name: /^Kal/ }));
  fireEvent.click(screen.getByRole('radio', { name: '10:00 AM' }));
  expect(confirmButton()).toHaveTextContent('₹230'); // 180 + 50 fee
  fireEvent.click(confirmButton());

  await waitFor(() => expect(axios.post.mock.calls[0][1].paymentMethod).toBe('online'));
  await waitFor(() => expect(payForBooking).toHaveBeenCalledWith('b9', expect.objectContaining({ name: 'Asha Rao' })));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/track/b9'));
});

test('the price breakdown shows the service charge, the fee and the total', async () => {
  render(<Booking />);
  const summary = await screen.findByLabelText('Booking summary');
  expect(within(summary).getByText('₹180')).toBeInTheDocument();
  expect(within(summary).getByText('₹50')).toBeInTheDocument();
  expect(within(summary).getByText('₹230')).toBeInTheDocument();
});

describe('remembering what was entered', () => {
  const key = 'nipungo_booking_draft_Gardener';

  test('a refresh brings back the date, time and note', async () => {
    sessionStorage.setItem(key, JSON.stringify({ date: '2026-11-08', time: '03:00 PM', note: 'second floor', paymentMethod: 'online', addressId: 'a2' }));
    render(<Booking />);
    await waitFor(() => expect(screen.getByRole('radio', { name: '03:00 PM' })).toHaveAttribute('aria-checked', 'true'));
    expect(screen.getByLabelText(/Koi extra detail/)).toHaveValue('second floor');
    expect(screen.getByRole('radio', { name: /Abhi online pay karo/ })).toHaveAttribute('aria-checked', 'true');
    await waitFor(() => expect(screen.getByRole('radio', { name: /Work/ })).toHaveAttribute('aria-checked', 'true'));
  });

  test('a remembered time that has already passed is dropped, not submitted', async () => {
    sessionStorage.setItem(key, JSON.stringify({ date: '2026-11-07', time: '09:00 AM', note: '' }));
    render(<Booking />);
    await screen.findByLabelText('Booking summary');
    await waitFor(() => expect(screen.queryByRole('radio', { name: '09:00 AM' })).toBeNull());
    expect(confirmButton()).toBeDisabled();
  });

  test('a remembered date from the past is dropped', async () => {
    sessionStorage.setItem(key, JSON.stringify({ date: '2026-11-01', time: '10:00 AM' }));
    render(<Booking />);
    await screen.findByLabelText('Booking summary');
    await waitFor(() => expect(screen.getByText('Pehle date chuno')).toBeInTheDocument());
  });

  test('a successful booking clears the remembered choices', async () => {
    axios.post.mockResolvedValue({ data: { success: true, booking: { _id: 'b1' } } });
    render(<Booking />);
    fireEvent.click(await screen.findByRole('radio', { name: /^Kal/ }));
    fireEvent.click(screen.getByRole('radio', { name: '10:00 AM' }));
    expect(JSON.parse(sessionStorage.getItem(key)).time).toBe('10:00 AM');
    fireEvent.click(confirmButton());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    expect(sessionStorage.getItem(key)).toBeNull();
  });
});

describe('without a saved address', () => {
  test('the add-address form is open straight away and its result is selected for booking', async () => {
    mockApi({ addresses: [] });
    axios.post.mockResolvedValue({ data: { addresses: [{ _id: 'n1', label: 'Home', full: '9 New Street, Pune - 411002', isDefault: true }] } });
    render(<Booking />);

    fireEvent.change(await screen.findByPlaceholderText(/Ghar \/ flat/), { target: { value: '9 New Street' } });
    fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Pune' } });
    fireEvent.change(screen.getByPlaceholderText(/Pincode/), { target: { value: '41100x2' } }); // letters dropped
    fireEvent.click(screen.getByRole('button', { name: /Save address/ }));

    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('/user/addresses', {
      label: 'Home', line: '9 New Street', landmark: '', city: 'Pune', pincode: '411002',
    }));
    await waitFor(() => expect(screen.getByRole('radio', { name: /Home/ })).toHaveAttribute('aria-checked', 'true'));
  });
});

describe('when something goes wrong', () => {
  const pickSlot = async () => {
    fireEvent.click(await screen.findByRole('radio', { name: /^Kal/ }));
    fireEvent.click(screen.getByRole('radio', { name: '10:00 AM' }));
  };

  test('"no worker available" is explained and nothing is navigated', async () => {
    axios.post.mockResolvedValue({ data: { success: false, noWorkers: true, message: 'Abhi Gardener ka koi worker available nahi hai.' } });
    render(<Booking />);
    await pickSlot();
    fireEvent.click(confirmButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(/koi worker available nahi/);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('a server refusal (e.g. time just passed) is shown', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Yeh time nikal chuka hai. Aage ka time slot chuno!' } } });
    render(<Booking />);
    await pickSlot();
    fireEvent.click(confirmButton());
    expect(await screen.findByRole('alert')).toHaveTextContent(/time nikal chuka hai/);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('the button cannot be double-clicked into two bookings', async () => {
    let finish;
    axios.post.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<Booking />);
    await pickSlot();
    const button = confirmButton();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(axios.post).toHaveBeenCalledTimes(1);
    finish({ data: { success: true, booking: { _id: 'b1' } } });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/track/b1'));
  });
});

test('a worker shortage is flagged before the customer fills anything in', async () => {
  mockApi({ availability: {} });
  render(<Booking />);
  expect(await screen.findByRole('status')).toHaveTextContent(/koi worker available nahi/);
});

test('an unknown service shows a clear message instead of a broken form', async () => {
  mockService = 'Astrologer';
  render(<Booking />);
  expect(await screen.findByText(/Ye service nahi mili/)).toBeInTheDocument();
  expect(screen.getByText('Services dekho').closest('a')).toHaveAttribute('href', '/services');
});
