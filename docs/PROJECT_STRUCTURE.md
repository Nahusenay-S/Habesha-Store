# Habesha Store - Project Structure

## Overview

Habesha Store is a full-stack e-commerce application with a monorepo structure.

## Directory Structure

```
Habesha-Store/
│
├── frontend/                 # Next.js Frontend Application
│   ├── pages/               # Next.js pages and API routes
│   ├── components/          # Reusable React components
│   ├── styles/              # Global styles
│   ├── public/              # Static assets
│   ├── package.json
│   ├── next.config.js
│   └── tailwind.config.js
│
├── backend/                 # Express.js Backend API
│   ├── routes/              # API route handlers
│   ├── models/              # MongoDB schemas
│   ├── middleware/          # Custom middleware
│   ├── controllers/         # Business logic
│   ├── utils/               # Utility functions
│   ├── server.js            # Express server entry point
│   ├── package.json
│   └── .env.example
│
├── docs/                    # Project documentation
│   └── PROJECT_STRUCTURE.md
│
├── package.json             # Root package.json with scripts
├── README.md                # Project README
└── .gitignore               # Git ignore rules
```

## Frontend (Next.js)

- **Pages**: Application pages and routing
- **Components**: Reusable UI components (Header, Footer, ProductCard, etc.)
- **Styles**: Tailwind CSS configuration and global styles
- **Public**: Images, fonts, and other static assets

## Backend (Express.js)

- **Routes**: Define API endpoints
- **Models**: MongoDB schema definitions (User, Product, Order, etc.)
- **Controllers**: Handle business logic for routes
- **Middleware**: Authentication, validation, error handling
- **Utils**: Helper functions, constants, validators

## Key Features to Implement

- [ ] User authentication (signup, login, logout)
- [ ] Product catalog and search
- [ ] Shopping cart functionality
- [ ] Order management
- [ ] Payment processing (Stripe)
- [ ] Seller dashboard
- [ ] Reviews and ratings
- [ ] Multi-language support (Amharic/English)
- [ ] Admin panel

## Tech Stack Details

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Axios for API calls
- Zustand for state management

### Backend
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcryptjs for password hashing

## Getting Started

See main README.md for setup instructions.