import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import { RequireRole, GuestOnly } from './components/RouteGuards';
import { showCustomerSite, showWorkerSite } from './utils/auth';
import Home from './pages/Home';
import Services from './pages/Services';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import WorkerProfile from './pages/WorkerProfile';
import AdminDashboard from './pages/AdminDashboard';
import Review from './pages/Review';
import WorkerDashboard from './pages/WorkerDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

// One codebase, two sites:
//   customers:  /, /services, /login, /register, /booking/*, /dashboard, /profile
//   workers:    /worker/login, /worker/register, /worker/dashboard, /profile
// Build with REACT_APP_PORTAL=customer or =worker to deploy them as separate websites;
// the default ('all') serves both from one place.
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="mt-16">
        <Routes>
          {/* Landing: the worker-only site goes straight to the worker area */}
          <Route
            path="/"
            element={showCustomerSite ? <Home /> : <Navigate to="/worker/dashboard" replace />}
          />

          {/* ── Customer site ── */}
          {showCustomerSite && (
            <>
              <Route path="/services" element={<Services />} />
              <Route path="/login" element={<GuestOnly><Login portal="customer" /></GuestOnly>} />
              <Route path="/register" element={<GuestOnly><Register portal="customer" /></GuestOnly>} />
              <Route
                path="/booking/:serviceName"
                element={<RequireRole roles={['customer']}><Booking /></RequireRole>}
              />
              <Route
                path="/dashboard"
                element={<RequireRole roles={['customer']}><Dashboard /></RequireRole>}
              />
              <Route
                path="/review/:bookingId"
                element={<RequireRole roles={['customer']}><Review /></RequireRole>}
              />
            </>
          )}
          {!showCustomerSite && (
            <>
              <Route path="/login" element={<Navigate to="/worker/login" replace />} />
              <Route path="/register" element={<Navigate to="/worker/register" replace />} />
            </>
          )}

          {/* ── Worker site (static paths win over /worker/:workerId below) ── */}
          {showWorkerSite && (
            <>
              <Route path="/worker/login" element={<GuestOnly><Login portal="worker" /></GuestOnly>} />
              <Route path="/worker/register" element={<GuestOnly><Register portal="worker" /></GuestOnly>} />
              <Route
                path="/worker/dashboard"
                element={<RequireRole roles={['worker']}><WorkerDashboard /></RequireRole>}
              />
              {/* old link (also used in older emails) */}
              <Route path="/worker-dashboard" element={<Navigate to="/worker/dashboard" replace />} />
            </>
          )}

          {/* Public worker profile (customers look at workers) */}
          {showCustomerSite && <Route path="/worker/:workerId" element={<WorkerProfile />} />}

          {/* Account page for both kinds of users */}
          <Route
            path="/profile"
            element={<RequireRole roles={['customer', 'worker']}><Profile /></RequireRole>}
          />

          <Route
            path="/admin"
            element={<RequireRole roles={['admin']}><AdminDashboard /></RequireRole>}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      {showCustomerSite && <ChatWidget />}
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;
