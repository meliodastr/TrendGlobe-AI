export default async function handler(req, res) {
  // 1. Sadece POST isteklerine izin ver (Güvenlik için)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Yalnızca POST istekleri kabul edilir.' });
  }

  // 2. Gelen veriyi al
  const { title, category } = req.body;

  // Başlık veya kategori boşsa hata döndür
  if (!title || !category) {
    return res.status(400).json({ error: 'Başlık ve kategori bilgisi eksik.' });
  }

  // 3. Vercel'e eklediğin API Anahtarını oku
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error("HATA: Vercel üzerinde OPENAI_API_KEY tanımlanmamış!");
    return res.status(500).json({ error: 'Sistem yapılandırma hatası: API anahtarı bulunamadı.' });
  }

  try {
    // 4. OpenAI API'sine istek gönder
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Hızlı ve ucuz model
        messages: [
          { 
            role: "system", 
            content: "Sen profesyonel bir trend analistisin. Sana verilen trendin neden popüler olduğunu ve e-ticaret/içerik üreticileri için nasıl bir fırsat sunduğunu maksimum 20 kelimelik, etkileyici ve profesyonel bir Türkçe cümle ile açıkla." 
          },
          { 
            role: "user", 
            content: `Trend Başlığı: ${title}, Kategori: ${category}` 
          }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();

    // 5. OpenAI'den gelen hata kontrolü
    if (data.error) {
      console.error("OpenAI API Hatası:", data.error.message);
      return res.status(500).json({ error: `AI Hatası: ${data.error.message}` });
    }

    // 6. Başarılı sonucu döndür
    const analysis = data.choices[0].message.content;
    return res.status(200).json({ analysis: analysis });

  } catch (err) {
    console.error("Sunucu Hatası:", err);
    return res.status(500).json({ error: 'Analiz sırasında sunucu tarafında bir hata oluştu.' });
  }
}