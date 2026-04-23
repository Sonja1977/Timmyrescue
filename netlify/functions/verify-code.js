const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { code } = JSON.parse(event.body);

    if (!code || !code.startsWith('TIMMY-')) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, error: 'Ungültiger Code' }),
      };
    }

    // Search Stripe checkout sessions for this access code
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    const match = sessions.data.find(s =>
      s.metadata?.accessCode === code.trim().toUpperCase() &&
      s.payment_status === 'paid'
    );

    if (match) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: true }),
      };
    } else {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, error: 'Code nicht gefunden oder Zahlung ausstehend' }),
      };
    }
  } catch (error) {
    console.error('Verify error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: false, error: 'Serverfehler' }),
    };
  }
};
