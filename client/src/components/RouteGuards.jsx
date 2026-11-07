import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUser, homeFor, loginFor } from '../utils/auth';

// Re-render when someone logs in or out in this tab (or another one)
const useAuthUser = () => {
  const [user, setUser] = useState(getUser);
  useEffect(() => {
    const refresh = () => setUser(getUser());
    window.addEventListener('authchange', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('authchange', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  return user;
};

// Only these roles may see the page.
//  - not logged in      -> the matching login page (and back here afterwards)
//  - wrong kind of user -> their own home, never a half-broken page
export function RequireRole({ roles, children }) {
  const user = useAuthUser();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to={loginFor(roles.includes('worker') && !roles.includes('customer') ? 'worker' : 'customer')}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }
  return children;
}

// Login / register pages: someone who is already logged in is sent to their home
export function GuestOnly({ children }) {
  const user = useAuthUser();
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
