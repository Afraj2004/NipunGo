import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from './Profile';
import axios from '../utils/axios';

jest.mock(
  'react-router-dom',
  () => ({ Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a> }),
  { virtual: true }
);

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const customer = { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', phone: '9876543210', role: 'customer', addresses: [] };
const worker = { ...customer, role: 'worker', service: 'Plumber', city: 'Pune', photoUrl: '' };

const setup = (profile) => {
  localStorage.setItem('token', 'old-token');
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: profile.name, role: profile.role }));
  axios.get.mockImplementation(async (url) =>
    url === '/user/profile'
      ? { data: { user: profile } }
      : { data: { addresses: [], max: 5 } }
  );
};

beforeEach(() => localStorage.clear());

test('customers see their details and a saved-addresses section', async () => {
  setup(customer);
  render(<Profile />);
  expect(await screen.findByDisplayValue('Asha Rao')).toBeInTheDocument();
  expect(screen.getByDisplayValue('asha@example.com')).toHaveAttribute('readonly');
  expect(screen.getByDisplayValue('9876543210')).toHaveAttribute('readonly');
  expect(screen.getByText(/Saved addresses/)).toBeInTheDocument();
});

test('workers get a link to their worker profile instead of addresses', async () => {
  setup(worker);
  render(<Profile />);
  expect(await screen.findByText(/Worker profile/)).toBeInTheDocument();
  expect(screen.getByText(/Profile tab kholo/).closest('a')).toHaveAttribute('href', '/worker/dashboard');
  expect(screen.queryByText(/Saved addresses/)).toBeNull();
});

test('changing the name saves it and updates the stored user', async () => {
  setup(customer);
  axios.put.mockResolvedValue({ data: { user: { ...customer, name: 'Asha K Rao' } } });
  render(<Profile />);

  fireEvent.change(await screen.findByLabelText(/Full name/), { target: { value: 'Asha K Rao' } });
  fireEvent.click(screen.getByText('Save changes'));

  await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/user/profile', { name: 'Asha K Rao' }));
  expect(await screen.findByText(/Naam update ho gaya/)).toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem('user')).name).toBe('Asha K Rao');
});

test('the save button is disabled until the name actually changes', async () => {
  setup(customer);
  render(<Profile />);
  await screen.findByDisplayValue('Asha Rao');
  expect(screen.getByText('Save changes')).toBeDisabled();
});

test('a weak new password is refused without calling the server', async () => {
  setup(customer);
  render(<Profile />);
  fireEvent.change(await screen.findByLabelText(/Purana password/), { target: { value: 'Old12345' } });
  fireEvent.change(screen.getByLabelText(/Naya password/), { target: { value: 'weak' } });
  fireEvent.click(screen.getByText('Password badlo'));

  expect(await screen.findByText(/kam se kam 8 characters/)).toBeInTheDocument();
  expect(axios.put).not.toHaveBeenCalled();
});

test('after a password change the session switches to the fresh token', async () => {
  setup(customer);
  axios.put.mockResolvedValue({ data: { success: true, token: 'fresh-token' } });
  render(<Profile />);

  fireEvent.change(await screen.findByLabelText(/Purana password/), { target: { value: 'Old12345' } });
  fireEvent.change(screen.getByLabelText(/Naya password/), { target: { value: 'Brandnew123' } });
  fireEvent.click(screen.getByText('Password badlo'));

  await waitFor(() =>
    expect(axios.put).toHaveBeenCalledWith('/user/password', { currentPassword: 'Old12345', newPassword: 'Brandnew123' })
  );
  await waitFor(() => expect(localStorage.getItem('token')).toBe('fresh-token'));
  expect(await screen.findByText(/Password change ho gaya/)).toBeInTheDocument();
});

test('a wrong current password shows the server message and keeps the old token', async () => {
  setup(customer);
  axios.put.mockRejectedValue({ response: { data: { message: 'Purana password galat hai!' } } });
  render(<Profile />);

  fireEvent.change(await screen.findByLabelText(/Purana password/), { target: { value: 'Nope12345' } });
  fireEvent.change(screen.getByLabelText(/Naya password/), { target: { value: 'Brandnew123' } });
  fireEvent.click(screen.getByText('Password badlo'));

  expect(await screen.findByText(/Purana password galat hai/)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBe('old-token');
});
