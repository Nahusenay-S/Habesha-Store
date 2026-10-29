const { getPlatformConfig } = require('../services/platformConfig');

const getPublicConfig = async (req, res) => {
  const config = await getPlatformConfig();
  return res.json({
    currency: config.currency,
    shipping: config.shipping,
    paymentMethods: {
      stripe: { enabled: config.paymentMethods.stripe.enabled, publishableKey: config.paymentMethods.stripe.publishableKey, currency: config.paymentMethods.stripe.currency },
      telebirr: { enabled: config.paymentMethods.telebirr.enabled, merchantName: config.paymentMethods.telebirr.merchantName },
      paypal: { enabled: config.paymentMethods.paypal.enabled, clientId: config.paymentMethods.paypal.clientId },
    },
  });
};

module.exports = { getPublicConfig };
