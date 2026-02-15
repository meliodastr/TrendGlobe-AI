export default async function handler(req, res) {
  // CORS ayarları (Admin panelinin erişebilmesi için)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST' });

  const { title } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI Anahtarı Vercel'de eksik!' });
  }

  try {
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sen bir trend analistisin. Bu trendi 15 kelimede Türkçe analiz et." },
          { role: "user", content: `Trend: ${title}` }
        ]
      })
    });

    const data = await aiRes.json();
    return res.status(200).json({ analysis: data.choices[0].message.content });
  } catch (err) {
    return res.status(500).json({ error: 'AI Hatası: ' + err.message });
  }
}
