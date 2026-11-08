import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CallButton from './CallButton';
import axios from '../utils/axios';

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

test('no number is shown until the button is pressed', () => {
  render(<CallButton bookingId="b1" />);
  expect(screen.getByRole('button', { name: /Call karo/ })).toBeInTheDocument();
  expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  expect(axios.get).not.toHaveBeenCalled();
});

test('pressing it asks the server for this booking, then shows a tap-to-call link', async () => {
  axios.get.mockResolvedValue({ data: { success: true, name: 'Ravi Kumar', phone: '9876543210' } });
  render(<CallButton bookingId="b1" />);
  fireEvent.click(screen.getByRole('button', { name: /Call karo/ }));

  await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/booking/call/b1'));
  const link = await screen.findByRole('link', { name: /Ravi Kumar: 9876543210/ });
  expect(link).toHaveAttribute('href', 'tel:9876543210');
  expect(screen.getByText(/sirf is booking ke liye/)).toBeInTheDocument();
});

test('a refusal from the server is shown and no number appears', async () => {
  axios.get.mockRejectedValue({ response: { data: { message: 'Call sirf tab ho sakta hai jab booking chal rahi ho ya payment baaki ho.' } } });
  render(<CallButton bookingId="b1" />);
  fireEvent.click(screen.getByRole('button', { name: /Call karo/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/booking chal rahi ho/);
  expect(document.querySelector('a[href^="tel:"]')).toBeNull();
  // and they can try again
  expect(screen.getByRole('button', { name: /Call karo/ })).toBeEnabled();
});

test('the button is disabled while the number is being fetched (no double requests)', async () => {
  let finish;
  axios.get.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  render(<CallButton bookingId="b1" />);
  const button = screen.getByRole('button', { name: /Call karo/ });
  fireEvent.click(button);
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(axios.get).toHaveBeenCalledTimes(1);
  finish({ data: { name: 'Ravi', phone: '9876543210' } });
  await screen.findByRole('link');
});
