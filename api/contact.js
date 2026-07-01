// Vercel Serverless Function — runs solo lato server.
// La access key Web3Forms resta nelle variabili d'ambiente di Vercel e non viene mai inviata al browser.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo non consentito.' });
    return;
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    res.status(500).json({ error: 'Variabile d\'ambiente WEB3FORMS_ACCESS_KEY non configurata.' });
    return;
  }

  const { nome, email, telefono, azienda, tipo, messaggio } = req.body || {};

  if (!nome || !email || !telefono || !tipo || !messaggio) {
    res.status(400).json({ error: 'Campi obbligatori mancanti.' });
    return;
  }

  try {
    const web3Res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: 'Nuova richiesta dal sito Glem Sec',
        from_name: nome,
        nome,
        email,
        telefono,
        azienda,
        tipo,
        messaggio
      })
    });
    const data = await web3Res.json();

    if (!data.success) {
      res.status(502).json({ error: data.message || 'Invio non riuscito.' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella chiamata a Web3Forms.' });
  }
};
