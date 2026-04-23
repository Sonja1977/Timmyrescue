const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

function generateCode() {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `TIMMY-${part1}-${part2}`;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const accessCode = generateCode();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Rette Timmy! 🐋',
            description: 'Das Ostsee-Buckelwal-Browserspiel – 3 Level + Endless-Modus',
          },
          unit_amount: 99,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.URL}/success.html?code=${accessCode}`,
      cancel_url: `${process.env.URL}/`,
      locale: 'de',
      metadata: { accessCode },
    });

    // Save code to Netlify Blobs immediately
    const { getStore } = require('@netlify/blobs');
    const store = getStore('timmy-codes');
    await store.set(accessCode, 'valid');
    console.log(`Saved code to Blobs: ${accessCode}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
