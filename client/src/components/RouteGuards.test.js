import { render, screen } from '@testing-library/react';
import { RequireRole, GuestOnly } from './RouteGuards';

// react-router-dom v7 can't be resolved by CRA's Jest, so stub what the guards use.
// <Navigate> renders a marker so we can see where it would send the user.
jest.mock(
  'react-router-dom',
  () => ({
    Navigate: ({ to, state }) => (
      <div data-testid="redirect" data-to={to} data-from={state?.from || ''} />
    ),
    useLocation: () => ({ pathname: '/booking/Plumber' }),
  }),
  { virtual: true }
);

beforeEach(() => localStorage.clear());

const loginAs = (role) => {
  localStorage.setItem('token', 't');
  localStorage.setItem('user', JSON.stringify({ id: 'u1', name: 'T', role }));
};

describe('RequireRole', () => {
  test('a guest is sent to the customer login and remembered for afterwards', () => {
    render(<RequireRole roles={['customer']}><div>secret</div></RequireRole>);
    const r = screen.getByTestId('redirect');
    expect(r).toHaveAttribute('data-to', '/login');
    expect(r).toHaveAttribute('data-from', '/booking/Plumber');
    expect(screen.queryByText('secret')).toBeNull();
  });

  test('a guest on a worker-only page is sent to the worker login', () => {
    render(<RequireRole roles={['worker']}><div>secret</div></RequireRole>);
    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/worker/login');
  });

  test('the right role sees the page', () => {
    loginAs('customer');
    render(<RequireRole roles={['customer']}><div>secret</div></RequireRole>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  test.each([
    ['worker', 'customer', '/worker/dashboard'],
    ['customer', 'worker', '/dashboard'],
    ['customer', 'admin', '/dashboard'],
  ])('a %s opening a %s-only page is sent home (%s=>%s)', (role, required, home) => {
    loginAs(role);
    render(<RequireRole roles={[required]}><div>secret</div></RequireRole>);
    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', home);
    expect(screen.queryByText('secret')).toBeNull();
  });

  test('an admin opening a customer page lands on the admin area', () => {
    loginAs('admin');
    render(<RequireRole roles={['customer']}><div>secret</div></RequireRole>);
    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/admin');
  });

  test('a token without a stored user (or the reverse) counts as logged out', () => {
    localStorage.setItem('token', 't');
    render(<RequireRole roles={['customer']}><div>secret</div></RequireRole>);
    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/login');
  });
});

describe('GuestOnly', () => {
  test('guests see the login / register page', () => {
    render(<GuestOnly><div>login form</div></GuestOnly>);
    expect(screen.getByText('login form')).toBeInTheDocument();
  });

  test('logged-in users are redirected to their own home', () => {
    loginAs('worker');
    render(<GuestOnly><div>login form</div></GuestOnly>);
    expect(screen.getByTestId('redirect')).toHaveAttribute('data-to', '/worker/dashboard');
    expect(screen.queryByText('login form')).toBeNull();
  });
});
