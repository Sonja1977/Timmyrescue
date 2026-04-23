module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { code } = req.body;
    const cleanCode = (code || '').trim().toUpperCase();

    // Validate format: TIMMY-XXXX-XXXX (14 chars total)
    const codeRegex = /^TIMMY-[A-F0-9]{4}-[A-F0-9]{4}$/;
    const valid = codeRegex.test(cleanCode);

    return res.status(200).json({
      valid,
      error: valid ? null : 'Ungültiger Code. Format: TIMMY-XXXX-XXXX'
    });
  } catch (error) {
    return res.status(500).json({ valid: false, error: error.message });
  }
};
