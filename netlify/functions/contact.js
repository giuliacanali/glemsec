exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Metodo non consentito.' })
    };
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  if (!accessKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Variabile d\'ambiente WEB3FORMS_ACCESS_KEY non configurata.' })
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Body non valido.' })
    };
  }

  const { nome, email, telefono, azienda, tipo, messaggio } = body || {};

  if (!nome || !email || !telefono || !tipo || !messaggio) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Campi obbligatori mancanti.' })
    };
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
      return {
        statusCode: 502,
        body: JSON.stringify({ error: data.message || 'Invio non riuscito.' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Errore nella chiamata a Web3Forms.' })
    };
  }
};
