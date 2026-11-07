import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Register from './Register';
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
  default: { get: jest.fn(), post: jest.fn() },
}));

beforeEach(() => {
  localStorage.clear();
  axios.post.mockImplementation(async (url) => {
    if (url === '/auth/register/start') return { data: { success: true, resendAfterSeconds: 30 } };
    if (url === '/auth/register/verify') {
      return {
        data: {
          success: true,
          token: 'tok123',
          user: { id: 'u1', name: 'Asha Rao', role: 'customer' },
        },
      };
    }
    return { data: { success: true } };
  });
});

const type = (placeholder, value) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

const fillStep1 = () => {
  type('Apna pura naam', 'Asha Rao');
  type('apna@email.com', 'asha@example.com');
  fireEvent.click(screen.getByText(/Next/));
};

test('no account is created until the emailed OTP is verified', async () => {
  render(<Register />);
  fillStep1();

  type('10 digit number', '9876543210');
  type('8+ characters, letter + number', 'Secret123');
  fireEvent.click(screen.getByText(/OTP Bhejo/));

  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith('/auth/register/start', {
      name: 'Asha Rao',
      email: 'asha@example.com',
      phone: '9876543210',
      password: 'Secret123',
      role: 'customer',
    })
  );
  // still logged out: only the OTP step is showing
  expect(localStorage.getItem('token')).toBeNull();
  expect(await screen.findByText(/asha@example.com/)).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText(/6 digit code/i), { target: { value: '654321' } });
  fireEvent.click(screen.getByRole('button', { name: /^Verify/ }));

  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith('/auth/register/verify', {
      email: 'asha@example.com',
      otp: '654321',
    })
  );
  await waitFor(() => expect(localStorage.getItem('token')).toBe('tok123'));
  expect(JSON.parse(localStorage.getItem('user')).role).toBe('customer');
});

test('a weak password is refused before any request is sent', async () => {
  render(<Register />);
  fillStep1();
  type('10 digit number', '9876543210');
  type('8+ characters, letter + number', 'abc');
  fireEvent.click(screen.getByText(/OTP Bhejo/));

  expect(await screen.findByText(/kam se kam 8 characters/)).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
});

test('the Verify button stays disabled until all 6 digits are entered', async () => {
  render(<Register />);
  fillStep1();
  type('10 digit number', '9876543210');
  type('8+ characters, letter + number', 'Secret123');
  fireEvent.click(screen.getByText(/OTP Bhejo/));
  await screen.findByText(/6 digit ka OTP/);

  const verify = screen.getByRole('button', { name: /^Verify/ });
  expect(verify).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/6 digit code/i), { target: { value: '123' } });
  expect(verify).toBeDisabled();
  fireEvent.change(screen.getByLabelText(/6 digit code/i), { target: { value: '123456' } });
  expect(verify).toBeEnabled();
});

test('a wrong OTP shows the server message and does not log in', async () => {
  axios.post.mockImplementation(async (url) => {
    if (url === '/auth/register/start') return { data: { success: true, resendAfterSeconds: 30 } };
    throw { response: { data: { message: 'OTP galat hai! 4 attempt bache hain.' } } };
  });
  render(<Register />);
  fillStep1();
  type('10 digit number', '9876543210');
  type('8+ characters, letter + number', 'Secret123');
  fireEvent.click(screen.getByText(/OTP Bhejo/));
  await screen.findByText(/6 digit ka OTP/);

  fireEvent.change(screen.getByLabelText(/6 digit code/i), { target: { value: '000000' } });
  fireEvent.click(screen.getByRole('button', { name: /^Verify/ }));

  expect(await screen.findByText(/OTP galat hai/)).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
});
