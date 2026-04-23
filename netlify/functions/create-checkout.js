const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

function generateCode() {
  // Generate a readable code like TIMMY-A3F9-X7K2
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
            images: [],
          },
          unit_amount: 99,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/`,
      locale: 'de',
      metadata: { accessCode },
      // Stripe sends a confirmation email automatically with the receipt
      // We add the access code in the custom fields shown on receipt
      custom_text: {
        after_submit: {
          message: `Dein persönlicher Zugangscode: ${accessCode} — Bitte speichere diesen Code! Du kannst ihn jederzeit auf timmyrescue.netlify.app eingeben um das Spiel zu starten.`
        }
      }
    });

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
