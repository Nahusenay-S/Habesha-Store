const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'ETB',
      enum: ['ETB', 'USD', 'EUR'],
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'telebirr', 'paypal', 'bank_transfer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: String,
    stripeSessions: [{
      sessionId: String,
      createdAt: Date,
    }],
    telebirrReference: String,
    paypalOrderId: String,
    bankDetails: {
      bankName: String,
      accountNumber: String,
      transferReference: String,
    },
    metadata: {
      description: String,
      customerEmail: String,
      customerPhone: String,
    },
    errorMessage: String,
    receiptUrl: String,
    invoiceNumber: String,
    paidAt: Date,
    failedAt: Date,
    refundedAt: Date,
    refundAmount: Number,
    refundReason: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);