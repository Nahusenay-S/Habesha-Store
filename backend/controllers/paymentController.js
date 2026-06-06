const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const { v4: uuidv4 } = require('uuid');

// Generate invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${new Date().getFullYear()}-${timestamp}`;
};

// Create Stripe payment intent
const createStripePaymentIntent = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Order ID and amount required' });
    }

    const order = await Order.findById(orderId).populate('buyer');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        orderId: orderId,
        userId: req.userId,
      },
      receipt_email: order.buyer.email,
    });

    // Save payment record
    const payment = await Payment.create({
      order: orderId,
      user: req.userId,
      amount,
      currency: 'USD',
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      status: 'processing',
      metadata: {
        description: `Order #${orderId}`,
        customerEmail: order.buyer.email,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment._id,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Confirm Stripe payment
const confirmStripePayment = async (req, res) => {
  try {
    const { paymentIntentId, paymentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update payment status
      const payment = await Payment.findByIdAndUpdate(
        paymentId,
        {
          status: 'completed',
          transactionId: paymentIntentId,
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
        message: 'Payment successful',
        payment,
      });
    } else if (paymentIntent.status === 'requires_payment_method') {
      await Payment.findByIdAndUpdate(paymentId, { status: 'failed' });
      res.status(400).json({ error: 'Payment requires payment method' });
    } else {
      res.status(400).json({ error: `Payment status: ${paymentIntent.status}` });
    }
  } catch (error) {
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

// Get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.userId })
      .populate('order')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process refund
const processRefund = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.paymentMethod === 'stripe' && payment.stripePaymentIntentId) {
      // Create refund in Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        reason: reason || 'requested_by_customer',
      });

      // Update payment
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'refunded',
        refundedAt: new Date(),
        refundAmount: payment.amount,
        refundReason: reason,
      });

      // Update order
      await Order.findByIdAndUpdate(payment.order, {
        status: 'cancelled',
        paymentStatus: 'refunded',
      });

      res.json({
        message: 'Refund processed successfully',
        refundId: refund.id,
      });
    } else {
      res.status(400).json({ error: 'Refund not supported for this payment method' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Stripe webhook handler
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntent.id },
          { status: 'completed', paidAt: new Date() }
        );
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: failedIntent.id },
          {
            status: 'failed',
            errorMessage: failedIntent.last_payment_error?.message,
            failedAt: new Date(),
          }
        );
        break;

      case 'charge.refunded':
        const refundedCharge = event.data.object;
        await Payment.findOneAndUpdate(
          { stripePaymentIntentId: refundedCharge.payment_intent },
          { status: 'refunded', refundedAt: new Date() }
        );
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createStripePaymentIntent,
  confirmStripePayment,
  generateInvoice,
  getPaymentHistory,
  getPaymentById,
  processRefund,
  handleStripeWebhook,
};