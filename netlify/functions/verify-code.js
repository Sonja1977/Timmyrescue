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

    // Search through multiple pages of Stripe sessions
    let found = false;
    let hasMore = true;
    let startingAfter = undefined;

    while (hasMore && !found) {
      const params = { limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;

      const sessions = await stripe.checkout.sessions.list(params);

      for (const s of sessions.data) {
        const sessionCode = (s.metadata?.accessCode || '').trim().toUpperCase();
        if (sessionCode === cleanCode && s.payment_status === 'paid') {
          found = true;
          break;
        }
      }

      hasMore = sessions.has_more;
      if (sessions.data.length > 0) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
      } else {
        hasMore = false;
      }

      // Safety: max 5 pages (500 sessions)
      if (startingAfter && sessions.data.length < 100) hasMore = false;
    }

    if (found) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: true }),
      };
    } else {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, error: 'Code nicht gefunden. Bitte prüfe ob du ihn korrekt eingegeben hast.' }),
      };
    }
  } catch (error) {
    console.error('Verify error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valid: false, error: 'Serverfehler – bitte versuche es nochmal' }),
    };
  }
};
