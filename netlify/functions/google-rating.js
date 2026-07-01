exports.handler = async function(event, context) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Variabili d\'ambiente non configurate.' })
    };
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total,url&key=${apiKey}`;
    const googleRes = await fetch(url);
    const data = await googleRes.json();

    if (data.status !== 'OK') {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `Google Places API: ${data.status}` })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate'
      },
      body: JSON.stringify({
        rating: data.result.rating,
        userRatingsTotal: data.result.user_ratings_total,
        url: data.result.url
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore nella chiamata a Google Places API.' })
    };
  }
};
