export default async function handler(req, res) {
  // 1. Güvenlik Kontrolü: Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, category } = req.body;
  const apiKey = process.env.OPENAI_API_KEY;

  // 2. Anahtar Kontrolü
  if (!apiKey) {
    console.error("HATA: Vercel üzerinde OPENAI_API_KEY bulunamadı!");
    return res.status(500).json({ error: 'Sistem hatası: API anahtarı eksik.' });
  }

  try {
    // 3. OpenAI'ye İstek Gönder
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "Sen profesyonel bir trend analistisin. Trendin popülerlik nedenini ve e-ticaret potansiyelini tek bir kısa cümlede (max 20 kelime) Türkçe açıkla." 
          },
          { role: "user", content: `Trend: ${title}, Kategori: ${category}` }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // 4. OpenAI'den gelen hata var mı kontrol et
    if (data.error) {
      console.error("OpenAI API Hatası:", data.error.message);
      return res.status(500).json({ error: data.error.message });
    }

    // 5. Başarılı Sonucu Gönder
    const aiComment = data.choices[0].message.content;
    return res.status(200).json({ analysis: aiComment });

  } catch (error) {
    console.error("Sunucu Hatası:", error);
    return res.status(500).json({ error: "OpenAI ile iletişim kurulamadı." });
  }
}