import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Add token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: () => api.get('/orders'),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  getSellerFulfillment: () => api.get('/orders/seller/fulfillment'),
  updateSellerStatus: (id, status, trackingNumber) => api.put(`/orders/seller/${id}/status`, { status, trackingNumber }),
};

export const reviewAPI = {
  getByProduct: (productId) => api.get(`/reviews/product/${productId}`),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
};

export const paymentAPI = {
  // Stripe
  createStripePaymentIntent: (data) => api.post('/payments/stripe/create-intent', data),
  confirmStripePayment: (data) => api.post('/payments/stripe/confirm', data),
  // Telebirr
  initiateTelebirrPayment: (data) => api.post('/payments/telebirr/create', data),
  verifyTelebirrPayment: (data) => api.post('/payments/telebirr/verify', data),
  checkTelebirrStatus: (ref) => api.get(`/payments/telebirr/status/${ref}`),
  // PayPal
  createPayPalOrder: (data) => api.post('/payments/paypal/create-order', data),
  capturePayPalPayment: (data) => api.post('/payments/paypal/capture', data),
  // General
  getPaymentHistory: () => api.get('/payments/history'),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  processRefund: (data) => api.post('/payments/refund', data),
};

export const vendorAPI = {
  getSummary: () => api.get('/vendor/summary'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

export const configAPI = {
  getPublic: () => api.get('/config/public'),
};

export const adminAPI = {
  getOverview: () => api.get('/admin/overview'),
  getPaymentConfig: () => api.get('/admin/payment-config'),
  updatePaymentConfig: (data) => api.put('/admin/payment-config', data),
};

export default api;