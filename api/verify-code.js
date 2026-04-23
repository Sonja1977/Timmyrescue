const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const { code } = req.body;
    const cleanCode = (code || '').trim().toUpperCase();

    if (!cleanCode || !cleanCode.startsWith('TIMMY-')) {
      return res.status(200).json({ valid: false, error: 'Ungültiger Code' });
    }

    // Search Stripe sessions
    let found = false;
    let page = await stripe.checkout.sessions.list({ limit: 100 });

    while (true) {
      for (const s of page.data) {
        const sessionCode = (s.metadata?.accessCode || '').trim().toUpperCase();
        if (sessionCode === cleanCode && s.payment_status === 'paid') {
          found = true;
          break;
        }
      }
      if (found || !page.has_more) break;
      page = await stripe.checkout.sessions.list({
        limit: 100,
        starting_after: page.data[page.data.length - 1].id
      });
    }

    return res.status(200).json({
      valid: found,
      error: found ? null : 'Code nicht gefunden. Bitte prüfe ob du ihn korrekt eingegeben hast.'
    });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ valid: false, error: 'Serverfehler: ' + error.message });
  }
};
