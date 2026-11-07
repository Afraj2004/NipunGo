import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ForgotPasswordModal from './ForgotPasswordModal';
import axios from '../utils/axios';

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

beforeEach(() => {
  axios.post.mockResolvedValue({ data: { success: true, resendAfterSeconds: 30 } });
});

const type = (placeholder, value) =>
  fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });

test('forgot password: email -> OTP + new password -> done', async () => {
  const onClose = jest.fn();
  render(<ForgotPasswordModal open onClose={onClose} />);

  // 1) email
  type('apna@email.com', 'asha@example.com');
  fireEvent.click(screen.getByText(/OTP Bhejo/));
  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'asha@example.com' })
  );

  // 2) OTP + password
  expect(await screen.findByText(/Naya Password/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/6 digit code/i), { target: { value: '123456' } });
  type('8+ characters, letter + number', 'Newpass123');
  fireEvent.click(screen.getByText(/Password Badlo/));

  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith('/auth/reset-password', {
      email: 'asha@example.com',
      otp: '123456',
      password: 'Newpass123',
    })
  );

  // 3) done
  expect(await screen.findByText(/Password change ho gaya/)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Login Karo/));
  expect(onClose).toHaveBeenCalled();
});

test('a weak new password is refused before calling the server', async () => {
  render(<ForgotPasswordModal open onClose={() => {}} />);
  type('apna@email.com', 'asha@example.com');
  fireEvent.click(screen.getByText(/OTP Bhejo/));
  await screen.findByText(/Naya Password/);
  axios.post.mockClear();

  fireEvent.change(screen.getByLabelText(/6 digit code/i), { target: { value: '123456' } });
  type('8+ characters, letter + number', 'short');
  fireEvent.click(screen.getByText(/Password Badlo/));

  expect(await screen.findByText(/kam se kam 8 characters/)).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
});

test('the OTP box only accepts digits, max 6', async () => {
  render(<ForgotPasswordModal open onClose={() => {}} />);
  type('apna@email.com', 'asha@example.com');
  fireEvent.click(screen.getByText(/OTP Bhejo/));
  await screen.findByText(/Naya Password/);

  const box = screen.getByLabelText(/6 digit code/i);
  fireEvent.change(box, { target: { value: '12ab34-56789' } });
  expect(box.value).toBe('123456');
});

test('server errors are shown to the user', async () => {
  axios.post.mockRejectedValue({ response: { data: { message: 'Bahut zyada requests!' } } });
  render(<ForgotPasswordModal open onClose={() => {}} />);
  type('apna@email.com', 'asha@example.com');
  fireEvent.click(screen.getByText(/OTP Bhejo/));
  expect(await screen.findByText(/Bahut zyada requests/)).toBeInTheDocument();
});
