const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { title } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Trend analizi yap. 15 kelime Türkçe." },
          { role: "user", content: `Trend: ${title}` }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      // Kotan bittiyse burası çalışacak
      return res.status(200).json({ analysis: "AI Kotası Doldu! (Lütfen OpenAI hesabına bakiye yükle veya yeni anahtar al)." });
    }

    return res.status(200).json({ analysis: data.choices[0].message.content });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
