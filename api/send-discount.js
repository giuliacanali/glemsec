// Vercel Serverless Function — runs solo lato server.
// La API key Brevo resta nelle variabili d'ambiente di Vercel e non viene mai inviata al browser.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo non consentito.' });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Variabile d\'ambiente BREVO_API_KEY non configurata.' });
    return;
  }

  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email non valida.' });
    return;
  }

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: 'Glem Sec', email: 'tintorialavanderiaglemsec@gmail.com' },
        to: [{ email }],
        subject: 'Il tuo sconto del 10% da Glem Sec',
        htmlContent: `
          <div style="font-family:Arial,sans-serif; max-width:480px; margin:0 auto; color:#0d2639;">
            <h2 style="color:#0d2639;">Ciao!</h2>
            <p>Ecco il tuo codice sconto per il primo ritiro in negozio da Glem Sec:</p>
            <p style="font-size:22px; font-weight:bold; letter-spacing:2px; color:#0d2639; border:2px dashed #e2b253; display:inline-block; padding:12px 24px; border-radius:10px;">BENVENUTO10</p>
            <p>Dillo in negozio al momento del ritiro per ricevere il 10% di sconto. Un utilizzo per cliente.</p>
            <p>Via Fratelli Bonnet, 20, Roma — Lun–Ven 8:00–19:00, Sab 9:00–13:00</p>
            <p>A presto,<br>Glem Sec</p>
          </div>
        `
      })
    });
    const data = await brevoRes.json();

    if (!brevoRes.ok) {
      res.status(502).json({ error: data.message || 'Invio non riuscito.' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella chiamata a Brevo.' });
  }
};
