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
    console.log(`Generated code: ${accessCode}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Rette Timmy! 🐋',
            description: 'Das Ostsee-Buckelwal-Browserspiel – 3 Level + Endless-Modus',
            images: [],
          },
          unit_amount: 99,
        },
        quantity: 1,
      }],
      mode: 'payment',
      // Pass code directly in success URL so we don't need to look it up
      success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}&code=${accessCode}`,
      cancel_url: `${process.env.URL}/`,
      locale: 'de',
      metadata: { accessCode },
    });

    console.log(`Session created: ${session.id} with code: ${accessCode}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
