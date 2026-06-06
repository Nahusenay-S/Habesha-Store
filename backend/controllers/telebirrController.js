const axios = require('axios');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const { v4: uuidv4 } = require('uuid');

// Telebirr API configuration
const TELEBIRR_API_BASE = process.env.TELEBIRR_API_BASE || 'https://api.telebirr.com/v1';
const TELEBIRR_API_KEY = process.env.TELEBIRR_API_KEY;
const TELEBIRR_MERCHANT_ID = process.env.TELEBIRR_MERCHANT_ID;
const TELEBIRR_MERCHANT_PIN = process.env.TELEBIRR_MERCHANT_PIN;

// Generate invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${new Date().getFullYear()}-${timestamp}`;
};

// Create Telebirr payment request
const createTelebirrPayment = async (req, res) => {
  try {
    const { orderId, amount, phoneNumber } = req.body;

    if (!orderId || !amount || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Order ID, amount, and phone number required' 
      });
    }

    const order = await Order.findById(orderId).populate('buyer');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate Ethiopian phone number format
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone.match(/^(251|\+251|0)(9\d{8})$/)) {
      return res.status(400).json({ 
        error: 'Invalid Ethiopian phone number format' 
      });
    }

    // Generate unique reference ID
    const referenceId = `HS-${Date.now()}-${uuidv4().slice(0, 8)}`;

    // Create payment record with pending status
    const payment = await Payment.create({
      order: orderId,
      user: req.userId,
      amount,
      currency: 'ETB',
      paymentMethod: 'telebirr',
      telebirrReference: referenceId,
      status: 'pending',
      metadata: {
        description: `Order #${orderId}`,
        customerEmail: order.buyer.email,
        customerPhone: phoneNumber,
      },
    });

    // Prepare Telebirr payment request
    const paymentRequest = {
      merchantId: TELEBIRR_MERCHANT_ID,
      merchantPin: TELEBIRR_MERCHANT_PIN,
      amount: amount,
      currency: 'ETB',
      referenceId: referenceId,
      description: `Habesha Store Order #${orderId}`,
      phoneNumber: cleanPhone,
      merchantCallback: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/telebirr/callback`,
      notificationUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/telebirr/webhook`,
      metadata: {
        orderId: orderId.toString(),
        paymentId: payment._id.toString(),
        customerEmail: order.buyer.email,
      },
    };

    // Send request to Telebirr API
    const telebirrResponse = await axios.post(
      `${TELEBIRR_API_BASE}/checkout`,
      paymentRequest,
      {
        headers: {
          'Authorization': `Bearer ${TELEBIRR_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (telebirrResponse.data.statusCode !== '0000') {
      throw new Error(`Telebirr API error: ${telebirrResponse.data.statusDescription}`);
    }

    // Return checkout URL and payment ID
    res.json({
      referenceId: referenceId,
      paymentId: payment._id,
      checkoutUrl: telebirrResponse.data.data?.checkoutUrl,
      transactionId: telebirrResponse.data.data?.transactionId,
      message: 'Payment request created successfully. Please complete payment on Telebirr.',
    });
  } catch (error) {
    console.error('Telebirr error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create Telebirr payment' 
    });
  }
};

// Verify Telebirr payment status
const verifyTelebirrPayment = async (req, res) => {
  try {
    const { referenceId, paymentId } = req.body;

    if (!referenceId || !paymentId) {
      return res.status(400).json({ 
        error: 'Reference ID and Payment ID required' 
      });
    }

    // Check payment status with Telebirr
    const statusResponse = await axios.get(
      `${TELEBIRR_API_BASE}/query`,
      {
        params: {
          merchantId: TELEBIRR_MERCHANT_ID,
          referenceId: referenceId,
        },
        headers: {
          'Authorization': `Bearer ${TELEBIRR_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paymentStatus = statusResponse.data.data?.status;

    if (paymentStatus === '0000' || paymentStatus === 'COMPLETED') {
      // Update payment status to completed
      const payment = await Payment.findByIdAndUpdate(
        paymentId,
        {
          status: 'completed',
          transactionId: referenceId,
          paidAt: new Date(),
        },
        { new: true }
      );

      // Update order status
      await Order.findByIdAndUpdate(
        payment.order,
        {
          paymentStatus: 'completed',
          status: 'confirmed',
        }
      );

      // Generate invoice
      await generateInvoice(payment.order, paymentId);

      res.json({
        message: 'Payment verified successfully',
        status: 'completed',
        payment,
      });
    } else if (paymentStatus === 'PENDING') {
      res.json({
        message: 'Payment is still pending',
        status: 'pending',
      });
    } else {
      // Payment failed
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'failed',
        errorMessage: statusResponse.data.data?.statusDescription || 'Payment failed',
        failedAt: new Date(),
      });

      res.status(400).json({
        message: 'Payment failed',
        status: 'failed',
        error: statusResponse.data.data?.statusDescription,
      });
    }
  } catch (error) {
    console.error('Telebirr verification error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to verify Telebirr payment' 
    });
  }
};

// Telebirr callback handler
const handleTelebirrCallback = async (req, res) => {
  try {
    const { referenceId, status, transactionId } = req.body;

    console.log('Telebirr callback received:', { referenceId, status, transactionId });

    const payment = await Payment.findOne({ telebirrReference: referenceId });

    if (!payment) {
      console.warn('Payment not found for reference:', referenceId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === '0000' || status === 'COMPLETED') {
      // Update payment status
      const updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
          status: 'completed',
          transactionId: transactionId || referenceId,
          paidAt: new Date(),
        },
        { new: true }
      );

      // Update order status
      await Order.findByIdAndUpdate(
        payment.order,
        {
          paymentStatus: 'completed',
          status: 'confirmed',
        }
      );

      // Generate invoice
      await generateInvoice(payment.order, payment._id);

      res.json({
        statusCode: '0000',
        statusDescription: 'Payment processed successfully',
      });
    } else {
      // Mark payment as failed
      await Payment.findByIdAndUpdate(payment._id, {
        status: 'failed',
        errorMessage: `Telebirr status: ${status}`,
        failedAt: new Date(),
      });

      res.json({
        statusCode: '0001',
        statusDescription: 'Payment failed',
      });
    }
  } catch (error) {
    console.error('Telebirr callback error:', error);
    res.status(500).json({
      statusCode: '0001',
      statusDescription: 'Callback processing error',
    });
  }
};

// Telebirr webhook handler for async notifications
const handleTelebirrWebhook = async (req, res) => {
  try {
    const { referenceId, status, transactionId } = req.body;

    console.log('Telebirr webhook received:', { referenceId, status, transactionId });

    const payment = await Payment.findOne({ telebirrReference: referenceId });

    if (!payment) {
      console.warn('Payment not found for reference:', referenceId);
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === '0000' || status === 'COMPLETED') {
      // Update payment status
      await Payment.findByIdAndUpdate(
        payment._id,
        {
          status: 'completed',
          transactionId: transactionId || referenceId,
          paidAt: new Date(),
        },
        { new: true }
      );

      // Update order status
      await Order.findByIdAndUpdate(
        payment.order,
        {
          paymentStatus: 'completed',
          status: 'confirmed',
        }
      );

      // Generate invoice
      await generateInvoice(payment.order, payment._id);
    } else if (status !== 'PENDING') {
      // Mark payment as failed (if not pending)
      await Payment.findByIdAndUpdate(payment._id, {
        status: 'failed',
        errorMessage: `Telebirr status: ${status}`,
        failedAt: new Date(),
      });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Telebirr webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate invoice
const generateInvoice = async (orderId, paymentId) => {
  try {
    const order = await Order.findById(orderId)
      .populate('items.product')
      .populate('buyer');
    const payment = await Payment.findById(paymentId);

    const invoiceNumber = generateInvoiceNumber();

    const invoiceData = {
      invoiceNumber,
      order: orderId,
      payment: paymentId,
      buyer: order.buyer._id,
      items: order.items.map((item) => ({
        product: item.product.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      subtotal: order.totalAmount,
      tax: Math.round(order.totalAmount * 0.15),
      shipping: 50,
      total: order.totalAmount + Math.round(order.totalAmount * 0.15) + 50,
      paymentMethod: payment.paymentMethod,
      status: 'paid',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paidDate: new Date(),
    };

    const invoice = await Invoice.create(invoiceData);

    // Update payment with invoice number
    await Payment.findByIdAndUpdate(paymentId, {
      invoiceNumber: invoiceNumber,
    });

    return invoice;
  } catch (error) {
    console.error('Invoice generation error:', error);
  }
};

// Get Telebirr payment status
const getTelebirrPaymentStatus = async (req, res) => {
  try {
    const { referenceId } = req.params;

    const payment = await Payment.findOne({ 
      telebirrReference: referenceId 
    }).populate('order');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      referenceId: payment.telebirrReference,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      order: payment.order,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTelebirrPayment,
  verifyTelebirrPayment,
  handleTelebirrCallback,
  handleTelebirrWebhook,
  getTelebirrPaymentStatus,
};
