// Vercel Edge Function — بروفيسور زكي يعمل بـ Google Gemini (مجاني)
// مفتاح GOOGLE_AI_KEY يبقى على الخادم فقط، لا يُرسل للمتصفح.

const DEFAULT_SYSTEM = `أنت بروفيسور زكي، طبيب وأستاذ خبير في كلية الطب. تساعدين الطالبة نغم السنوسي في دراستها الطبية.

قواعد الردود:
- ردودك باللغة العربية دائماً ما لم تُطلب الإنجليزية
- واضح، علمي، دقيق — كمرجع طبي موثوق
- استخدم المصطلحات الطبية مع شرحها بالعربية
- قدّم مثالاً سريرياً عملياً مع كل شرح نظري
- نظّم إجاباتك بعناوين (##) وقوائم عند الشرح المطوّل

**الصور الطبية — مطلوبة في كل شرح:**
عند شرح أي مفهوم تشريحي أو فسيولوجي أو مرضي أو دوائي:
1. ابحث عن صور توضيحية طبية عالية الجودة من Wikipedia أو Wikimedia Commons
2. أدرج الصور بصيغة ماركداون على سطر منفرد:
   ![وصف الصورة بالعربية](رابط_مباشر_للصورة.png)
3. اختر الروابط من مصادر موثوقة: Wikipedia، Wikimedia Commons، NIH
4. تأكد أن الرابط ينتهي بامتداد صورة (.png أو .jpg أو .svg)

أمثلة على روابط صور صحيحة:
![مخطط تشريح القلب](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Heart_diagram-en.svg/500px-Heart_diagram-en.svg.png)
![دورة كربس](https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Citric_acid_cycle_with_aconitate_2.svg/500px-Citric_acid_cycle_with_aconitate_2.svg.png)

أدرج صورة طبية واحدة على الأقل في كل إجابة تشريحية أو فسيولوجية.`;

export const config = { runtime: "edge" };

export default async function handler(req) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "مفتاح Google AI غير مضبوط على الخادم. أضيفيه من Vercel Dashboard." },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  try {
    const { messages, system, useWebSearch = true } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "messages مطلوبة" }, { status: 400 });
    }

    // تحويل الرسائل لصيغة Gemini
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: {
        parts: [{ text: system || DEFAULT_SYSTEM }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: 4096,
        temperature: 0.7,
      },
    };

    // البحث على Google مُفعَّل افتراضياً
    if (useWebSearch) {
      body.tools = [{ googleSearch: {} }];
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini: ${errText}`);
    }

    const data = await response.json();

    // استخراج النص
    const text =
      data.candidates?.[0]?.content?.parts
        ?.filter((p) => p.text)
        .map((p) => p.text)
        .join("") || "";

    // استخراج مصادر البحث من Google
    const groundingChunks =
      data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const citations = groundingChunks
      .filter((c) => c.web)
      .map((c) => ({
        title: c.web.title || "",
        url: c.web.uri || "",
        source: "",
      }));

    return Response.json(
      { text, citations },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (e) {
    console.error("chat error:", e);
    return Response.json(
      { error: e.message || "خطأ غير معروف في الخادم" },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
