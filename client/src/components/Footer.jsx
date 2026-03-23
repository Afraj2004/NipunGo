import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white">

      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Logo Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">
              Nipun<span className="text-secondary">Go</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Expert services at your doorstep. 
              Trusted workers, quality service!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              Quick Links
            </h3>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-gray-400 hover:text-white text-sm">
                Home
              </Link>
              <Link to="/services" className="text-gray-400 hover:text-white text-sm">
                Services
              </Link>
              <Link to="/login" className="text-gray-400 hover:text-white text-sm">
                Login
              </Link>
              <Link to="/register" className="text-gray-400 hover:text-white text-sm">
                Register
              </Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              Our Services
            </h3>
            <div className="flex flex-col gap-2">
              {[
                "Plumber",
                "Electrician", 
                "Carpenter",
                "Painter",
                "AC Mechanic",
                "Cleaner"
              ].map((service, index) => (
                <Link
                  key={index}
                  to="/services"
                  className="text-gray-400 hover:text-white text-sm"
                >
                  {service}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">
              Contact Us
            </h3>
            <div className="flex flex-col gap-2">
              <p className="text-gray-400 text-sm">
                📧 support@nipungo.com
              </p>
              <p className="text-gray-400 text-sm">
                📞 +91 98765 43210
              </p>
              <p className="text-gray-400 text-sm">
                📍 Delhi, India
              </p>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white text-xl">
                📘
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-xl">
                📷
              </a>
              <a href="#" className="text-gray-400 hover:text-white text-xl">
                🐦
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2026 NipunGo - All Rights Reserved
          </p>
          <p className="text-gray-400 text-sm mt-2 md:mt-0">
            Made with ❤️ in India
          </p>
        </div>
      </div>

    </footer>
  );
}

export default Footer;