import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
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

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="mt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/booking/:serviceName" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/worker-dashboard" element={<WorkerDashboard />} />
          <Route path="/worker/:workerId" element={<WorkerProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/review/:bookingId" element={<Review />} />
        </Routes>
      </div>
      <Footer />
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;