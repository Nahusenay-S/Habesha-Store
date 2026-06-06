# Habesha Store 🇪🇹

An Ethiopian E-Commerce Platform built with modern web technologies.

## About

Habesha Store is a full-stack e-commerce application designed to connect Ethiopian sellers and buyers. It features a marketplace for Ethiopian products including coffee, textiles, crafts, spices, and traditional items.

## Features

- 🛍️ Product Catalog with Ethiopian goods
- 👥 User Authentication (Buyers & Sellers)
- 🛒 Shopping Cart & Checkout
- 💳 Payment Integration (Birr support)
- 📦 Order Management & Tracking
- ⭐ Reviews & Ratings
- 🏪 Seller Dashboard
- 🌍 Multi-language Support (Amharic & English)
- 📱 Responsive Design

## Tech Stack

- **Frontend:** Next.js 14+, React 18, Tailwind CSS
- **Backend:** Express.js, Node.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Payments:** Stripe (Birr integration)
- **Deployment:** Vercel (Frontend), Heroku/Railway (Backend)

## Project Structure

```
Habesha-Store/
├── frontend/           # Next.js frontend
├── backend/            # Express.js backend
├── docs/              # Documentation
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB
- Git

### Installation

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:3000

#### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```
Backend runs on http://localhost:5000

### Both Together
```bash
npm install
npm run dev
```

## Contributing

Contributions are welcome! Please read our contributing guidelines.

## License

MIT License

---

Built with ❤️ by Nahusenay Simegn