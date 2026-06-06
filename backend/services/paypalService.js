const axios = require('axios');

const paypalAPI = axios.create({
  baseURL: process.env.PAYPAL_MODE === 'live' 
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com',
});

// Get access token
const getAccessToken = async () => {
  try {
    const response = await paypalAPI.post(
      '/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID,
          password: process.env.PAYPAL_CLIENT_SECRET,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('PayPal token error:', error);
    throw error;
  }
};

class PayPalService {
  // Create order
  static async createOrder(orderId, amount, description, returnUrl, cancelUrl) {
    try {
      const accessToken = await getAccessToken();

      const response = await paypalAPI.post(
        '/v2/checkout/orders',
        {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: orderId,
              amount: {
                currency_code: 'USD',
                value: (amount / 100).toFixed(2),
              },
              description: description,
            },
          ],
          application_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
            user_action: 'PAY_NOW',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayPal order creation error:', error);
      throw error;
    }
  }

  // Capture payment
  static async capturePayment(orderId) {
    try {
      const accessToken = await getAccessToken();

      const response = await paypalAPI.post(
        `/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayPal capture error:', error);
      throw error;
    }
  }

  // Get order details
  static async getOrderDetails(orderId) {
    try {
      const accessToken = await getAccessToken();

      const response = await paypalAPI.get(
        `/v2/checkout/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayPal get order error:', error);
      throw error;
    }
  }

  // Refund capture
  static async refundCapture(captureId, reason) {
    try {
      const accessToken = await getAccessToken();

      const response = await paypalAPI.post(
        `/v2/payments/captures/${captureId}/refund`,
        {
          note_to_payer: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayPal refund error:', error);
      throw error;
    }
  }
}

module.exports = PayPalService;