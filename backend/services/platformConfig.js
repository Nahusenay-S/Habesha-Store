const { query } = require('../db');

const defaultConfig = {
  currency: 'ETB',
  shipping: { flatRate: 50, freeThreshold: 1000 },
  paymentMethods: {
    stripe: { enabled: Boolean(process.env.STRIPE_SECRET_KEY), publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '', currency: process.env.STRIPE_CURRENCY || 'usd' },
    telebirr: { enabled: process.env.TELEBIRR_ENABLED !== 'false', merchantName: process.env.TELEBIRR_MERCHANT_NAME || 'Habesha Store' },
    paypal: { enabled: Boolean(process.env.PAYPAL_CLIENT_ID), clientId: process.env.PAYPAL_CLIENT_ID || '' },
  },
};

const getPlatformConfig = async () => {
  const result = await query('SELECT value FROM platform_settings WHERE key = $1', ['payment']);
  return result.rowCount ? { ...defaultConfig, ...result.rows[0].value, paymentMethods: { ...defaultConfig.paymentMethods, ...result.rows[0].value.paymentMethods } } : defaultConfig;
};

const savePlatformConfig = async (value) => {
  const config = { ...defaultConfig, ...value, paymentMethods: { ...defaultConfig.paymentMethods, ...value.paymentMethods } };
  await query(
    `INSERT INTO platform_settings (key, value, updated_at)
     VALUES ('payment', $1::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [JSON.stringify(config)]
  );
  return config;
};

module.exports = { defaultConfig, getPlatformConfig, savePlatformConfig };
