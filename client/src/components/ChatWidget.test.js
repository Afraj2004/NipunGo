import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatWidget from './ChatWidget';
import axios from '../utils/axios';
import { CHAT_EXPIRY_MS, saveChat, GREETING } from '../utils/chatStorage';

const mockNavigate = jest.fn();

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  }),
  { virtual: true }
);

jest.mock('../utils/axios', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  localStorage.clear();
  axios.get.mockResolvedValue({ data: { bookings: [{ address: '12 MG Road, Pune, India' }] } });
  axios.post.mockResolvedValue({ data: { success: true, reply: 'AI reply', suggestion: null } });
});

const loginAs = (role = 'customer') =>
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'Test', role }));

const openChat = () => fireEvent.click(screen.getByLabelText(/open nipun ai chat/i));
// accepts text/regex to look up, or an element that was already found
const click = (target) =>
  fireEvent.click(typeof target === 'string' || target instanceof RegExp ? screen.getByText(target) : target);
const type = (text) => {
  fireEvent.change(screen.getByPlaceholderText(/describe your problem/i), { target: { value: text } });
  fireEvent.keyDown(screen.getByPlaceholderText(/describe your problem/i), { key: 'Enter' });
};

test('tiles give an instant answer without calling the AI', async () => {
  loginAs();
  render(<ChatWidget />);
  openChat();

  click('💧 Pipe / nal leak');

  expect(await screen.findByText(/stopcock/i)).toBeInTheDocument();
  expect(screen.getByText(/Haan, Plumber book karo/)).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
});

test('typed known problems are answered from the knowledge base, not the AI', async () => {
  loginAs();
  render(<ChatWidget />);
  openChat();

  type('ac thanda nahi kar raha');

  expect(await screen.findByText(/Haan, AC Mechanic book karo/)).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
});

test('unknown questions go to the AI, and the reply shows no raw asterisks', async () => {
  loginAs();
  axios.post.mockResolvedValue({
    data: {
      success: true,
      reply: 'Aapko **Mechanic** chahiye, par hum ye service nahi dete.',
      suggestion: null,
    },
  });
  render(<ChatWidget />);
  openChat();

  type('meri car kharab ho gayi');

  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
  expect(axios.post.mock.calls[0][0]).toBe('/chat/message');
  expect(axios.post.mock.calls[0][1].message).toBe('meri car kharab ho gayi');
  const bold = await screen.findByText('Mechanic');
  expect(bold.tagName).toBe('STRONG');
});

test('the bot books on its own once the user agrees, no form needed', async () => {
  loginAs();
  axios.post.mockResolvedValue({
    data: { success: true, message: 'Booking request 2 workers ko bheji gayi!' },
  });
  render(<ChatWidget />);
  openChat();

  click('💧 Pipe / nal leak');
  click(await screen.findByText(/Haan, Plumber book karo/));

  // date -> time -> address (previous one offered) -> note -> confirm
  click(await screen.findByText(/^Kal \(/));
  click(await screen.findByText('10:00 AM'));
  click(await screen.findByText(/📍 12 MG Road, Pune, India/));
  click(await screen.findByRole('button', { name: /Skip/ }));
  expect(await screen.findByText(/Booking summary/)).toBeInTheDocument();
  click(screen.getByText(/Haan, confirm karo/));

  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
  expect(axios.post).toHaveBeenCalledWith('/booking/create', {
    service: 'Plumber',
    date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    time: '10:00 AM',
    address: '12 MG Road, Pune, India',
    description: '',
  });
  expect(await screen.findByText(/Booking request bhej di gayi/)).toBeInTheDocument();

  // and it offers to take the user to their booking
  click(screen.getByText(/Booking track karo/));
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
});

test('a failed booking keeps the details and offers a retry', async () => {
  loginAs();
  axios.post.mockRejectedValue({ response: { status: 500, data: { message: 'Server Error!' } } });
  render(<ChatWidget />);
  openChat();

  click('⚡ Bijli / switch problem');
  click(await screen.findByText(/Haan, Electrician book karo/));
  click(await screen.findByText(/^Kal \(/));
  click(await screen.findByText('02:00 PM'));
  click(await screen.findByText(/📍 12 MG Road/));
  click(await screen.findByRole('button', { name: /Skip/ }));
  click(await screen.findByText(/Haan, confirm karo/));

  expect(await screen.findByText(/Haan, dobara try karo/)).toBeInTheDocument();
});

test('guests can use tiles but are asked to log in to book', async () => {
  render(<ChatWidget />); // nobody logged in
  openChat();

  click('🔑 Lock / chabi problem');
  click(await screen.findByText(/Haan, Locksmith book karo/));

  expect(await screen.findByText(/pehle login karo/i)).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
});

test('workers and admins cannot book through the chat', async () => {
  loginAs('worker');
  render(<ChatWidget />);
  openChat();

  click('💧 Pipe / nal leak');
  click(await screen.findByText(/Haan, Plumber book karo/));

  expect(await screen.findByText(/sirf customer account/i)).toBeInTheDocument();
});

test('a chat left idle past the expiry is cleared and the user starts again', async () => {
  loginAs();
  saveChat('u1', {
    messages: [GREETING, { role: 'user', text: 'pipe leak' }],
    flow: null,
    lastActive: Date.now() - CHAT_EXPIRY_MS - 5000,
  });
  render(<ChatWidget />);
  openChat();

  expect(await screen.findByText(/pichli chat expire ho gayi/i)).toBeInTheDocument();
  expect(screen.queryByText('pipe leak')).not.toBeInTheDocument();
});

test('a recent chat is restored when the user comes back to the page', async () => {
  loginAs();
  saveChat('u1', {
    messages: [GREETING, { role: 'user', text: 'pipe leak' }, { role: 'bot', text: 'Plumber bhej dein?' }],
    flow: null,
    lastActive: Date.now() - 60 * 1000,
  });
  render(<ChatWidget />);
  openChat();

  expect(await screen.findByText('Plumber bhej dein?')).toBeInTheDocument();
  expect(screen.queryByText(/pichli chat expire/i)).not.toBeInTheDocument();
});
