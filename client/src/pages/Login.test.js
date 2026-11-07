import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import axios from '../utils/axios';

const mockNavigate = jest.fn();
let mockLocationState = null;

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/login', state: mockLocationState }),
    Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>,
  }),
  { virtual: true }
);

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

beforeEach(() => {
  localStorage.clear();
  mockLocationState = null;
});

const loginResponse = (role) => ({
  data: {
    success: true,
    token: 'tok',
    user: { id: 'u1', name: 'Test User', role },
  },
});

const submit = (identity = 'a@b.com', password = 'Secret123') => {
  fireEvent.change(screen.getByPlaceholderText(/Email ya 10-digit Phone/), { target: { value: identity } });
  fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: /^login/i }));
};

test('customer portal: a customer logs in and lands on the home page', async () => {
  axios.post.mockResolvedValue(loginResponse('customer'));
  render(<Login portal="customer" />);
  submit();

  await waitFor(() => expect(localStorage.getItem('token')).toBe('tok'));
  expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
});

test('customer portal: a worker account is turned away with a pointer to the worker login', async () => {
  axios.post.mockResolvedValue(loginResponse('worker'));
  render(<Login portal="customer" />);
  submit();

  expect(await screen.findByText(/worker account hai/i)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('worker portal: a customer account is turned away', async () => {
  axios.post.mockResolvedValue(loginResponse('customer'));
  render(<Login portal="worker" />);
  submit();

  expect(await screen.findByText(/customer account hai/i)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
});

test('worker portal: a worker goes to the worker dashboard', async () => {
  axios.post.mockResolvedValue(loginResponse('worker'));
  render(<Login portal="worker" />);
  submit();

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/worker/dashboard', { replace: true }));
});

test('an admin can log in from the customer portal and goes to /admin', async () => {
  axios.post.mockResolvedValue(loginResponse('admin'));
  render(<Login portal="customer" />);
  submit();

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin', { replace: true }));
});

test('after login the user returns to the page they were trying to open', async () => {
  mockLocationState = { from: '/booking/Plumber' };
  axios.post.mockResolvedValue(loginResponse('customer'));
  render(<Login portal="customer" />);
  submit();

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/booking/Plumber', { replace: true }));
});

test('each portal links to its own registration page', () => {
  const { unmount } = render(<Login portal="customer" />);
  expect(screen.getByText(/Register Karo/).closest('a')).toHaveAttribute('href', '/register');
  unmount();
  render(<Login portal="worker" />);
  expect(screen.getByText(/Register Karo/).closest('a')).toHaveAttribute('href', '/worker/register');
});

test('wrong credentials show the server message', async () => {
  axios.post.mockRejectedValue({ response: { data: { message: 'Email/Phone ya password galat hai!' } } });
  render(<Login portal="customer" />);
  submit();
  expect(await screen.findByText(/password galat hai/i)).toBeInTheDocument();
});
