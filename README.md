# 🏠 NipunGo - Expert Services at Your Doorstep

A full-stack web application marketplace connecting customers with skilled service providers for on-demand home services. Whether you need a plumber, electrician, cleaner, tutor, or any other expert service, NipunGo makes it easy to find and book the right professional.

**🌐 Live Demo:** [https://nipungo.vercel.app](https://nipungo.vercel.app)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Key Components](#key-components)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### For Customers
- 🔍 **Browse Services** - Explore various service categories
- 📝 **User Authentication** - Secure registration and login with JWT
- 📅 **Book Services** - Select worker, choose date/time, confirm booking
- 💳 **Secure Payments** - Integrated Razorpay payment gateway
- ⭐ **Leave Reviews** - Rate and review services after completion
- 📊 **Dashboard** - Track bookings, history, and profile management
- 🔄 **Recommendations** - Get personalized service suggestions

### For Service Providers (Workers)
- 👤 **Profile Management** - Showcase skills, experience, and portfolio
- 📈 **Worker Dashboard** - View incoming bookings and manage availability
- ✅ **Booking Management** - Accept/reject service requests
- 📧 **Email Notifications** - Stay updated on new bookings

### For Administrators
- 🛡️ **Admin Dashboard** - Platform analytics and user management
- 📊 **Metrics & Reports** - Monitor platform activity and performance
- 👥 **User Management** - Manage customers, workers, and services

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI library with hooks
- **React Router 7** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Axios** - HTTP client for API calls
- **Vercel Speed Insights** - Performance monitoring

### Backend
- **Node.js** - JavaScript runtime
- **Express 5** - Web framework and API server
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - Cloud image storage and CDN
- **Razorpay** - Payment processing
- **Nodemailer** - Email sending
- **Helmet** - Security middleware
- **Express Rate Limit** - DDoS protection

---

## 📁 Project Structure

```
NipunGo/
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable components
│   │   │   ├── Navbar.jsx          # Navigation bar
│   │   │   ├── Footer.jsx          # Footer component
│   │   │   └── ServiceCard.jsx     # Service display card
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.jsx            # Landing page
│   │   │   ├── Services.jsx        # Browse services
│   │   │   ├── Login.jsx           # User login
│   │   │   ├── Register.jsx        # User registration
│   │   │   ├── Booking.jsx         # Book a service
│   │   │   ├── Dashboard.jsx       # Customer dashboard
│   │   │   ├── WorkerDashboard.jsx # Worker dashboard
│   │   │   ├── AdminDashboard.jsx  # Admin dashboard
│   │   │   ├── WorkerProfile.jsx   # Worker profile view
│   │   │   └── Review.jsx          # Leave review
│   │   ├── utils/
│   │   │   └── axios.js            # Axios API instance
│   │   ├── App.js                  # Main app component
│   │   └── index.js                # Entry point
│   ├── package.json                # Dependencies
│   ├── tailwind.config.js          # Tailwind configuration
│   └── postcss.config.js           # PostCSS configuration
│
├── server/                          # Express Backend
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js                # User model
│   │   ├── Booking.js             # Booking model
│   │   └── Review.js              # Review model
│   ├── routes/                    # API routes
│   │   ├── auth.js                # Authentication endpoints
│   │   ├── booking.js             # Booking endpoints
│   │   ├── worker.js              # Worker endpoints
│   │   ├── admin.js               # Admin endpoints
│   │   ├── review.js              # Review endpoints
│   │   ├── payment.js             # Payment endpoints
│   │   ├── recommendations.js     # Recommendations endpoints
│   │   └── chat.js                # Chat endpoints
│   ├── middleware/                # Custom middleware
│   ├── utils/                     # Helper functions
│   ├── scripts/                   # Database scripts
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── index.js                   # Server entry point
│   └── package.json               # Dependencies
│
└── .github/                         # GitHub configuration
```

---

## 🚀 Installation

### Prerequisites
- Node.js (v14+) and npm
- MongoDB (local or Atlas)
- Git

### Clone the Repository
```bash
git clone https://github.com/Afraj2004/NipunGo.git
cd NipunGo
```

### Frontend Setup
```bash
cd client
npm install
```

### Backend Setup
```bash
cd server
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/nipungo

# JWT
JWT_SECRET=your_jwt_secret_key_here

# Cloudinary (Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay (Payments)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Nodemailer (Email)
NODEMAILER_USER=your_email@gmail.com
NODEMAILER_PASS=your_app_password

# Environment
NODE_ENV=development

# Server Port
PORT=5000
```

### How to get these credentials:
- **MongoDB Atlas:** [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- **Cloudinary:** [cloudinary.com](https://cloudinary.com)
- **Razorpay:** [razorpay.com](https://razorpay.com)
- **Gmail App Password:** [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

---

## ▶️ Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd server
npm run dev      # Uses nodemon for auto-reload
```

Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd client
npm start        # Opens browser automatically
```

Frontend will run on `http://localhost:3000`

### Production Build

**Frontend:**
```bash
cd client
npm run build    # Creates optimized build
```

**Backend:**
```bash
cd server
npm start        # Runs in production mode
```

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | User login |
| POST | `/logout` | User logout |
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update user profile |

### Bookings (`/api/booking`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create new booking |
| GET | `/all` | Get all bookings |
| GET | `/:id` | Get booking details |
| PUT | `/:id` | Update booking status |
| DELETE | `/:id` | Cancel booking |

### Workers (`/api/worker`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/all` | Get all workers |
| GET | `/:id` | Get worker profile |
| PUT | `/:id` | Update worker profile |
| POST | `/availability` | Set availability |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Admin dashboard data |
| GET | `/users` | Get all users |
| DELETE | `/users/:id` | Delete user |

### Reviews (`/api/review`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Submit review |
| GET | `/:bookingId` | Get booking review |

### Payments (`/api/payment`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create-order` | Create Razorpay order |
| POST | `/verify` | Verify payment |

### Recommendations (`/api/recommendations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get recommendations |

---

## 💾 Database Models

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: Enum ['customer', 'worker', 'admin'],
  avatar: String (Cloudinary URL),
  isVerified: Boolean,
  bookingHistory: [ObjectId],
  createdAt: Date
}
```

### Booking Schema
```javascript
{
  customerId: ObjectId (ref: User),
  workerId: ObjectId (ref: User),
  service: String,
  date: Date,
  time: String,
  location: String,
  status: Enum ['pending', 'accepted', 'completed', 'cancelled'],
  amount: Number,
  paymentStatus: Enum ['pending', 'completed', 'failed'],
  createdAt: Date
}
```

### Review Schema
```javascript
{
  bookingId: ObjectId (ref: Booking),
  rating: Number (1-5),
  comment: String,
  createdAt: Date
}
```

---

## 🧩 Key Components

### Navbar & Footer
- Responsive navigation with mobile menu
- Quick links to services and user account

### ServiceCard
- Display service with image, description, price
- Quick book button

### Authentication Flow
- JWT-based authentication
- Password hashing with bcryptjs
- Protected routes

### Booking System
- Multi-step booking process
- Real-time status updates
- Email confirmations

### Payment Integration
- Razorpay payment gateway
- Secure transaction handling
- Order verification

---

## 🔒 Security Features

- ✅ **CORS Protection** - Restricted to allowed origins
- ✅ **Helmet.js** - Security headers
- ✅ **Rate Limiting** - Prevents DDoS attacks (200 requests per 15 min)
- ✅ **JWT Tokens** - Stateless authentication
- ✅ **Password Hashing** - bcryptjs with salt rounds
- ✅ **Input Validation** - Express validator
- ✅ **HTTPS** - SSL/TLS in production
- ✅ **Error Handling** - Centralized error handler
- ✅ **File Upload Limits** - 5MB max file size

---

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 👥 Author

**Afraj2004** - [GitHub Profile](https://github.com/Afraj2004)

---

## 🙏 Acknowledgments

- React and React Router communities
- Express.js team
- Tailwind CSS
- MongoDB
- Cloudinary
- Razorpay
- All contributors and users

---

## 📞 Support

For issues, questions, or suggestions:
- Open an [Issue](https://github.com/Afraj2004/NipunGo/issues)
- Check existing documentation
- Contact through GitHub

---

**Made with ❤️ by Afraj2004**
