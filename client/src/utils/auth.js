// Small helpers for "who is logged in" and "where should they land".

// Which site this build is: 'all' (default), 'customer' or 'worker'.
// Deploy the same code twice (REACT_APP_PORTAL=customer / worker) for two separate sites.
export const PORTAL = process.env.REACT_APP_PORTAL || 'all';
export const showCustomerSite = PORTAL !== 'worker';
export const showWorkerSite = PORTAL !== 'customer';

export const getUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user && localStorage.getItem('token') ? user : null;
  } catch {
    return null;
  }
};

export const saveSession = ({ token, user }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('authchange'));
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('authchange'));
};

// The home page for each kind of account
export const homeFor = (role) => {
  if (role === 'admin') return '/admin';
  if (role === 'worker') return '/worker/dashboard';
  return '/dashboard';
};

// Where a guest must log in to reach pages of this role
export const loginFor = (role) => (role === 'worker' ? '/worker/login' : '/login');
