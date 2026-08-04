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

  const { email, marketing } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Email non valida.' });
    return;
  }

  const brevoHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'api-key': apiKey
  };

  try {
    // Controlla se questa email ha gia' ricevuto il codice in passato.
    const lookupRes = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
      headers: brevoHeaders
    });
    if (lookupRes.ok) {
      const contact = await lookupRes.json();
      if (contact.attributes && contact.attributes.DISCOUNT_CLAIMED) {
        res.status(409).json({ error: 'Questa email ha già ricevuto il codice sconto in precedenza. Un utilizzo per cliente.' });
        return;
      }
    }

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: brevoHeaders,
      body: JSON.stringify({
        sender: { name: 'Tintoria Lavanderia Glem Sec', email: 'tintorialavanderiaglemsec@gmail.com' },
        to: [{ email }],
        subject: 'Il tuo sconto del 10% da Glem Sec',
        htmlContent: `
          <div style="background:#f4f2ed; padding:32px 16px; font-family:Arial,sans-serif;">
            <div style="max-width:480px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e8e6e1;">
              <div style="background:#0d2639; padding:28px 32px; text-align:center;">
                <div style="display:inline-block; background:#f4f2ed; padding:8px 18px; border-radius:999px;">
                  <img src="https://tintorialavanderiaglemsec.com/assets/img/logo-glemsec.png" alt="Glem Sec" width="140" style="height:auto; max-width:140px; display:block;">
                </div>
              </div>
              <div style="padding:32px;">
                <h2 style="color:#0d2639; margin:0 0 12px; font-size:20px;">Ciao!</h2>
                <p style="color:#0d2639; font-size:15px; line-height:1.6; margin:0 0 20px;">Ecco il tuo codice sconto per il primo ritiro in negozio da Glem Sec:</p>
                <div style="text-align:center; margin:0 0 24px;">
                  <span style="display:inline-block; font-size:24px; font-weight:bold; letter-spacing:3px; color:#0d2639; border:2px dashed #e2b253; padding:14px 28px; border-radius:10px; background:#f4f2ed;">BENVENUTO10</span>
                </div>
                <p style="color:#0d2639; font-size:14px; line-height:1.6; margin:0 0 8px;">Mostraci il codice in negozio per ricevere lo sconto del 10%.</p>
                <p style="color:#5c6b7a; font-size:13px; line-height:1.6; margin:20px 0 0;">Via Fratelli Bonnet, 20, Roma<br>Lun–Ven 8:00–19:00 · Sab 9:00–13:00</p>
              </div>
              <div style="background:#0d2639; padding:18px 32px; text-align:center;">
                <p style="color:#e2b253; font-size:12px; margin:0; letter-spacing:.05em;">Non vediamo l'ora di vederti, Glem Sec</p>
              </div>
            </div>
          </div>
        `
      })
    });
    const data = await brevoRes.json();

    if (!brevoRes.ok) {
      res.status(502).json({ error: data.message || 'Invio non riuscito.' });
      return;
    }

    // Segna il codice come riscosso (e il consenso marketing, se dato) sul contatto Brevo.
    try {
      const attributes = {
        DISCOUNT_CLAIMED: true,
        DISCOUNT_CLAIMED_AT: new Date().toISOString()
      };
      if (marketing) {
        attributes.MARKETING_CONSENT = true;
        attributes.CONSENT_DATE = new Date().toISOString();
        attributes.CONSENT_SOURCE = 'Popup sconto benvenuto';
      }
      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({ email, attributes, updateEnabled: true })
      });
    } catch (err) {
      // Il codice sconto e' gia' stato inviato: un errore qui non deve far fallire la richiesta.
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella chiamata a Brevo.' });
  }
};
