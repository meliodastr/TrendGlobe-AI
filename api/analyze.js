// Bu dosya Vercel üzerinde gizli bir sunucu gibi çalışır
export default async function handler(req, res) {
  const { title, category } = req.body;
  const apiKey = process.env.OPENAI_API_KEY; // Vercel'e eklediğimiz anahtar

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Ekonomik ve hızlı model
        messages: [
          { role: "system", content: "Sen bir trend analistisin. Verilen trendin e-ticaret potansiyelini 2 kısa cümlede Türkçe açıkla." },
          { role: "user", content: `Trend: ${title}, Kategori: ${category}` }
        ],
      }),
    });

    const data = await response.json();
    const aiComment = data.choices[0].message.content;
    
    res.status(200).json({ analysis: aiComment });
  } catch (error) {
    res.status(500).json({ error: "OpenAI bağlanamadı." });
  }
}
