// api/analyze.js
export default async function handler(req, res) {
  // Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, category } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI anahtarı Vercel üzerinde tanımlı değil!' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Sen profesyonel bir trend analistisin. Verilen trendin neden popüler olduğunu ve e-ticaret potansiyelini tek bir kısa cümlede (maksimum 20 kelime) Türkçe açıkla." },
          { role: "user", content: `Trend: ${title}, Kategori: ${category}` }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error.message);
    }

    const aiComment = data.choices[0].message.content;
    return res.status(200).json({ analysis: aiComment });

  } catch (error) {
    console.error("OpenAI Hatası:", error);
    return res.status(500).json({ error: "OpenAI ile iletişim kurulamadı." });
  }
}
