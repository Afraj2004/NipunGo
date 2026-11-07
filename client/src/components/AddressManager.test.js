import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddressManager from './AddressManager';
import axios from '../utils/axios';

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const home = { _id: 'a1', label: 'Home', line: '12 MG Road', landmark: '', city: 'Pune', pincode: '411001', isDefault: true, full: '12 MG Road, Pune - 411001' };
const work = { _id: 'a2', label: 'Work', line: '5 Tech Park', landmark: 'Gate 2', city: 'Pune', pincode: '411057', isDefault: false, full: '5 Tech Park, Near Gate 2, Pune - 411057' };

beforeEach(() => {
  axios.get.mockResolvedValue({ data: { addresses: [home, work], max: 5 } });
  window.confirm = jest.fn(() => true);
});

test('lists saved addresses with the default marked', async () => {
  render(<AddressManager />);
  expect(await screen.findByText('12 MG Road, Pune - 411001')).toBeInTheDocument();
  expect(screen.getByText('5 Tech Park, Near Gate 2, Pune - 411057')).toBeInTheDocument();
  expect(screen.getAllByText('Default')).toHaveLength(1);
});

test('adds a new address', async () => {
  axios.get.mockResolvedValue({ data: { addresses: [], max: 5 } });
  axios.post.mockResolvedValue({ data: { addresses: [home] } });
  render(<AddressManager />);

  fireEvent.click(await screen.findByText(/Naya address add karo/));
  fireEvent.change(screen.getByPlaceholderText(/Ghar \/ flat/), { target: { value: '12 MG Road' } });
  fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Pune' } });
  fireEvent.change(screen.getByPlaceholderText(/Pincode/), { target: { value: '41100x1' } }); // letters are dropped
  fireEvent.click(screen.getByText(/Save ✅/));

  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith('/user/addresses', {
      label: 'Home',
      line: '12 MG Road',
      landmark: '',
      city: 'Pune',
      pincode: '411001',
    })
  );
  expect(await screen.findByText('12 MG Road, Pune - 411001')).toBeInTheDocument();
});

test('makes another address the default', async () => {
  axios.put.mockResolvedValue({
    data: { addresses: [{ ...home, isDefault: false }, { ...work, isDefault: true }] },
  });
  render(<AddressManager />);
  fireEvent.click(await screen.findByText('Default banao'));

  await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/user/addresses/a2/default'));
});

test('deletes after confirmation, and not if the user says no', async () => {
  axios.delete.mockResolvedValue({ data: { addresses: [work] } });
  render(<AddressManager />);
  await screen.findByText('12 MG Road, Pune - 411001');

  window.confirm = jest.fn(() => false);
  fireEvent.click(screen.getAllByText(/Delete/)[0]);
  expect(axios.delete).not.toHaveBeenCalled();

  window.confirm = jest.fn(() => true);
  fireEvent.click(screen.getAllByText(/Delete/)[0]);
  await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/user/addresses/a1'));
});

test('the add button is disabled at the limit', async () => {
  const five = Array.from({ length: 5 }, (_, i) => ({ ...work, _id: `x${i}`, isDefault: i === 0, full: `Addr ${i}` }));
  axios.get.mockResolvedValue({ data: { addresses: five, max: 5 } });
  render(<AddressManager />);
  const button = await screen.findByText(/Max 5 addresses/);
  expect(button).toBeDisabled();
});

test('server validation errors are shown', async () => {
  axios.get.mockResolvedValue({ data: { addresses: [], max: 5 } });
  axios.post.mockRejectedValue({ response: { data: { message: '6 digit ka pincode likho!' } } });
  render(<AddressManager />);
  fireEvent.click(await screen.findByText(/Naya address add karo/));
  fireEvent.change(screen.getByPlaceholderText(/Ghar \/ flat/), { target: { value: '12 MG Road' } });
  fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Pune' } });
  fireEvent.change(screen.getByPlaceholderText(/Pincode/), { target: { value: '123' } });
  fireEvent.click(screen.getByText(/Save ✅/));
  expect(await screen.findByText(/6 digit ka pincode/)).toBeInTheDocument();
});
