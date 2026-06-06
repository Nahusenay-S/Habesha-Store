const Payment = require('../models/Payment');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const PayPalService = require('../services/paypalService');

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  return `INV-${new Date().getFullYear()}-${timestamp}`;
};

// Create PayPal order
const createPayPalOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    const order = await Order.findById(orderId).populate('buyer');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const returnUrl = `${process.env.FRONTEND_URL}/payment/success`;
    const cancelUrl = `${process.env.FRONTEND_URL}/payment/failed`;

    // Create PayPal order
    const paypalOrder = await PayPalService.createOrder(
      orderId,
      order.totalAmount,
      `Order #${orderId}`,
      returnUrl,
      cancelUrl
    );

    // Create payment record
    const payment = await Payment.create({
      order: orderId,
      user: req.userId,
      amount: order.totalAmount,
      currency: 'USD',
      paymentMethod: 'paypal',
      status: 'processing',
      paypalOrderId: paypalOrder.id,
      metadata: {
        description: `Order #${orderId}`,
        customerEmail: order.buyer.email,
      },
    });

    res.json({
      paypalOrderId: paypalOrder.id,
      paymentId: payment._id,
      approvalUrl: paypalOrder.links.find(l => l.rel === 'approve')?.href,
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Capture PayPal payment
const capturePayPalPayment = async (req, res) => {
  try {
    const { paypalOrderId, paymentId } = req.body;

    // Capture with PayPal
    const captureResponse = await PayPalService.capturePayment(paypalOrderId);

    if (captureResponse.status === 'COMPLETED') {
      // Get transaction ID
      const transactionId = captureResponse.purchase_units[0]
        ?.payments?.captures?.[0]?.id;

      // Update payment
      const payment = await Payment.findByIdAndUpdate(
        paymentId,
        {
          status: 'completed',
          transactionId: transactionId,
          paidAt: new Date(),
        },
        { new: true }
      );

      // Update order
      await Order.findByIdAndUpdate(
        payment.order,
        {
          paymentStatus: 'completed',
          status: 'confirmed',
        }
      );

      // Generate invoice
      await generateInvoiceForPayment(payment.order, paymentId);

      res.json({
        message: 'Payment captured successfully',
        payment,
      });
    } else {
      await Payment.findByIdAndUpdate(paymentId, {
        status: 'failed',
        errorMessage: captureResponse.message,
        failedAt: new Date(),
      });
      res.status(400).json({ error: 'Payment capture failed' });
    }
  } catch (error) {
    console.error('Capture error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Process PayPal refund
const refundPayPalPayment = async (req, res) => {
  try {
    const { paymentId, reason } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.paymentMethod !== 'paypal' || !payment.transactionId) {
      return res.status(400).json({ error: 'Invalid payment method for refund' });
    }

    // Refund with PayPal
    const refundResponse = await PayPalService.refundCapture(
      payment.transactionId,
      reason || 'Customer request'
    );

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
      refundId: refundResponse.id,
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: error.message });
  }
};

const generateInvoiceForPayment = async (orderId, paymentId) => {
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

    await Payment.findByIdAndUpdate(paymentId, {
      invoiceNumber: invoiceNumber,
    });

    return invoice;
  } catch (error) {
    console.error('Invoice generation error:', error);
  }
};

module.exports = {
  createPayPalOrder,
  capturePayPalPayment,
  refundPayPalPayment,
};