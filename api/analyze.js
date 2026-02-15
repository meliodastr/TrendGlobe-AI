export default async function handler(req, res) {
  // CORS ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST' });

  const { title } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Vercel Ayarlarında OPENAI_API_KEY eksik!' });
  }

  try {
    // OpenAI API çağrısı (Global fetch kullanılır)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sen trend analiz uzmanısın. Trendi 15 kelimede Türkçe açıkla." },
          { role: "user", content: `Trend: ${title}` }
        ]
      })
    });

    const data = await response.json();
    
    if (data.error) {
        return res.status(500).json({ error: 'OpenAI Hatası: ' + data.error.message });
    }

    return res.status(200).json({ analysis: data.choices[0].message.content });
  } catch (err) {
    return res.status(500).json({ error: 'Server Hatası: ' + err.message });
  }
}
