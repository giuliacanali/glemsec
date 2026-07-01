// Vercel Serverless Function — runs solo lato server.
// La API key resta nelle variabili d'ambiente di Vercel e non viene mai inviata al browser.
module.exports = async function handler(req, res) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    res.status(500).json({ error: 'Variabili d\'ambiente GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID non configurate.' });
    return;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total,url&key=${apiKey}`;
    const googleRes = await fetch(url);
    const data = await googleRes.json();

    if (data.status !== 'OK') {
      res.status(502).json({ error: `Google Places API: ${data.status}` });
      return;
    }

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // cache 1h lato edge
    res.status(200).json({
      rating: data.result.rating,
      userRatingsTotal: data.result.user_ratings_total,
      url: data.result.url
    });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella chiamata a Google Places API.' });
  }
};
