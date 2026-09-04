# Habesha Store - Ethiopian E-Commerce Platform 🇪🇹

An Ethiopian E-Commerce Platform built with modern web technologies to connect Ethiopian sellers and buyers.

## Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- Git
- Stripe Account (for payments)

### Installation

**Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Backend runs on `http://localhost:5000`

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

**Both Together:**
```bash
npm install
npm run dev
```

## Features

- 🛍️ Product Catalog with Ethiopian goods
- 👥 User Authentication (Buyers & Sellers)
- 🛒 Shopping Cart & Checkout
- 💳 Payment Integration (Stripe, Telebirr, PayPal)
- 📦 Order Management & Tracking
- ⭐ Reviews & Ratings
- 🏪 Seller Dashboard
- 🌍 Multi-language Support (Amharic & English)
- 📱 Responsive Design

## Tech Stack

### Frontend
- **Next.js 14+** - React framework
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client

### Backend
- **Node.js + Express.js** - Server framework
- **MongoDB** - Database
- **JWT** - Authentication
- **Stripe** - Payment processing
- **Mongoose** - MongoDB ODM

## Project Structure

```
Habesha-Store/
├── backend/
│   ├── controllers/       # Route handlers (auth, products, payments, orders, reviews)
│   ├── models/           # MongoDB schemas (User, Product, Order, Payment, Review, Invoice)
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth & error handling
│   ├── utils/            # Helper functions (JWT, password hashing)
│   ├── services/         # Business logic (PayPal service)
│   ├── server.js         # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── pages/            # Next.js pages (home, login, register, products, cart, dashboard, payment)
│   ├── components/       # React components (Header, Footer, ProductCard, PaymentForm)
│   ├── context/          # Auth context for state management
│   ├── lib/              # Utilities (apiClient)
│   ├── store/            # Zustand stores (cartStore)
│   ├── styles/           # CSS modules
│   ├── _app.js           # Next.js app wrapper
│   └── package.json
│
├── docs/                 # Documentation
├── package.json          # Root package.json (workspace)
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Products
- `GET /api/products` - Get all products with filters
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (seller only)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Payments
- `POST /api/payments/stripe/create-intent` - Create Stripe intent
- `POST /api/payments/stripe/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history
- `POST /api/payments/webhook/stripe` - Stripe webhook handler
- `POST /api/payments/telebirr/checkout` - Telebirr payment
- `POST /api/payments/paypal/create-order` - PayPal order

### Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/:productId` - Get product reviews
- `PUT /api/reviews/:id` - Update review

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/habesha-store
JWT_SECRET=your_secure_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
TELEBIRR_API_KEY=...
TELEBIRR_MERCHANT_ID=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel deploy
```

### Backend (Heroku/Railway)
```bash
heroku create your-app-name
git push heroku main
```

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push branch: `git push origin feature/your-feature`
4. Open pull request

## License

MIT License

## Support

- 📧 Email: support@habeshastore.com
- 🐛 Issues: [GitHub Issues](https://github.com/Nahusenay-S/Habesha-Store/issues)

---

Built with ❤️ by Nahusenay Simegn
