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

    // Check Netlify Blobs
    const { getStore } = require('@netlify/blobs');
    const store = getStore('timmy-codes');
    const value = await store.get(cleanCode);
    console.log(`Checking code ${cleanCode}: ${value}`);

    const valid = value === 'valid';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        valid, 
        error: valid ? null : 'Code nicht gefunden. Bitte prüfe ob du ihn korrekt eingegeben hast.'
      }),
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
