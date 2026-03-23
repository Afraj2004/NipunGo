import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // LocalStorage se user lo
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md fixed w-full top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">

        {/* Logo */}
        <Link to="/">
          <h1 className="text-2xl font-bold text-primary">
            Nipun<span className="text-secondary">Go</span>
          </h1>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-gray-600 hover:text-primary font-medium">
            Home
          </Link>
          <Link to="/services" className="text-gray-600 hover:text-primary font-medium">
            Services
          </Link>

          {/* User Login Hai Toh */}
{user ? (
  <div className="flex items-center gap-4">
    <Link 
      to="/dashboard"
      className="text-gray-600 hover:text-primary font-medium"
    >
      Dashboard
    </Link>
    <span className="text-gray-600 font-medium">
      👋 {user.name}
    </span>
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600"
    >
      Logout
    </button>
  </div>
) : (
            // Agar User Login Nahi Hai
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 hover:text-primary font-medium">
                Login
              </Link>
              <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-full hover:bg-indigo-700">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <span className="text-2xl">✕</span>
            ) : (
              <span className="text-2xl">☰</span>
            )}
          </button>
        </div>

      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white px-4 pb-4 flex flex-col gap-3">
          <Link to="/" className="text-gray-600 hover:text-primary font-medium">
            Home
          </Link>
          <Link to="/services" className="text-gray-600 hover:text-primary font-medium">
            Services
          </Link>

          {user ? (
            <>
              <span className="text-gray-600 font-medium">
                👋 {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-full text-center"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-600 hover:text-primary font-medium">
                Login
              </Link>
              <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-full text-center">
                Register
              </Link>
            </>
          )}
        </div>
      )}

    </nav>
  );
}

export default Navbar;