const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { code } = JSON.parse(event.body);
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanCode || !cleanCode.startsWith('TIMMY-')) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, error: 'Ungültiger Code – muss mit TIMMY- beginnen' }),
      };
    }

    // Search through ALL Stripe sessions using auto-pagination
    let found = false;
    let page = await stripe.checkout.sessions.list({ limit: 100 });
    
    while (true) {
      for (const s of page.data) {
        const sessionCode = (s.metadata?.accessCode || '').trim().toUpperCase();
        console.log(`Checking session ${s.id}: code="${sessionCode}" status="${s.payment_status}"`);
        if (sessionCode === cleanCode && s.payment_status === 'paid') {
          found = true;
          break;
        }
      }
      
      if (found || !page.has_more) break;
      page = await stripe.checkout.sessions.list({ limit: 100, starting_after: page.data[page.data.length - 1].id });
    }

    console.log(`Code ${cleanCode} found: ${found}`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: found, error: found ? null : 'Code nicht gefunden. Bitte prüfe ob du ihn korrekt eingegeben hast.' }),
    };

  } catch (error) {
    console.error('Verify error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: false, error: 'Serverfehler: ' + error.message }),
    };
  }
};
