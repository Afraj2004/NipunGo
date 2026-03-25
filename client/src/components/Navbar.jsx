import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll detect karo
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // User check karo
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    setIsOpen(false);
  };

  // Active link check
  const isActive = (path) => location.pathname === path;

  const users = JSON.parse(localStorage.getItem('user'));

const navLinks = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/services', label: 'Services', icon: '🔧' },
  {
    path: users?.role === 'worker'
      ? '/worker-dashboard'
      : '/dashboard',
    label: 'Dashboard',
    icon: '📋'
  },
];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-lg'
          : 'bg-white bg-opacity-95 backdrop-blur-md shadow-sm'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">

          {/* Logo */}
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                N
              </div>
              <h1 className="text-2xl font-bold">
                <span className="text-primary">Nipun</span>
                <span className="text-secondary">Go</span>
              </h1>
            </motion.div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <motion.div
                  whileHover={{ y: -2 }}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-600 hover:bg-indigo-50 hover:text-primary'
                  }`}
                >
                  {link.label}
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Badge */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-xl"
                >
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-700 font-medium text-sm">
                    {user.name.split(' ')[0]}
                  </span>
                </motion.div>

                {/* Admin Link */}
                {user.email === 'admin@nipungo.com' && (
                  <Link to="/admin">
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="px-4 py-2 bg-gray-800 text-white rounded-xl font-medium text-sm hover:bg-gray-700 transition"
                    >
                      🔐 Admin
                    </motion.div>
                  </Link>
                )}

                {/* Logout Button */}
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-medium text-sm hover:bg-red-100 transition"
                >
                  Logout
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="px-4 py-2 text-gray-600 font-medium hover:text-primary transition"
                  >
                    Login
                  </motion.div>
                </Link>
                <Link to="/register">
                  <motion.div
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 bg-primary text-white rounded-xl font-medium shadow-md hover:bg-indigo-700 transition"
                  >
                    Register ✨
                  </motion.div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl"
          >
            <motion.div
              animate={{ rotate: isOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isOpen ? (
                <span className="text-xl font-bold text-gray-600">✕</span>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="w-5 h-0.5 bg-gray-600 rounded"></div>
                  <div className="w-5 h-0.5 bg-gray-600 rounded"></div>
                  <div className="w-5 h-0.5 bg-gray-600 rounded"></div>
                </div>
              )}
            </motion.div>
          </motion.button>

        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-2">

              {/* Nav Links */}
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${
                      isActive(link.path)
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-indigo-50'
                    }`}
                  >
                    <span>{link.icon}</span>
                    {link.label}
                  </Link>
                </motion.div>
              ))}

              {/* Divider */}
              <div className="border-t border-gray-100 my-2"></div>

              {/* Auth */}
              {user ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-xl">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {user.name}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Admin Link */}
                  {user.email === 'admin@nipungo.com' && (
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-800 text-white rounded-xl font-medium"
                    >
                      🔐 Admin Dashboard
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-500 rounded-xl font-medium"
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-primary text-primary rounded-xl font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-bold shadow-md"
                  >
                    Register ✨
                  </Link>
                </>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.nav>
  );
}

export default Navbar;