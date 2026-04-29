// Vercel Edge Function — وكيل آمن لـ Anthropic Claude API
// مفتاح ANTHROPIC_API_KEY يبقى على الخادم، لا يُرسل للمتصفح أبداً.

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEFAULT_SYSTEM = `أنت بروفيسور زكي، طبيب وأستاذ خبير في كلية الطب. تساعدين الطالبة نغم السنوسي في دراستها الطبية.

قواعد الردود:
- ردودك باللغة العربية دائماً ما لم تُطلب الإنجليزية
- واضح، علمي، دقيق — كمرجع طبي موثوق
- استخدم المصطلحات الطبية مع شرحها بالعربية
- قدّم مثالاً سريرياً عملياً مع كل شرح نظري
- نظّم إجاباتك بعناوين (##) وقوائم عند الشرح المطوّل

**الصور الطبية — مطلوبة في كل شرح:**
عند شرح أي مفهوم تشريحي أو فسيولوجي أو مرضي أو دوائي:
1. استخدم أداة البحث للعثور على صور توضيحية طبية عالية الجودة
2. أدرج الصور بصيغة ماركداون على سطر منفرد:
   ![وصف الصورة بالعربية](رابط_مباشر_للصورة.png)
3. اختر الروابط من مصادر موثوقة: Wikipedia، Wikimedia Commons، NIH، أو مواقع طبية أكاديمية
4. تأكد أن الرابط ينتهي بامتداد صورة (.png أو .jpg أو .svg)
5. أضف وصفاً عربياً واضحاً بين قوسي []

أمثلة على روابط صور صحيحة:
![مخطط تشريح القلب](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Heart_diagram-en.svg/500px-Heart_diagram-en.svg.png)
![دورة الكربس](https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Citric_acid_cycle_with_aconitate_2.svg/500px-Citric_acid_cycle_with_aconitate_2.svg.png)

أدرج صورة طبية واحدة على الأقل في كل إجابة تشريحية أو فسيولوجية.`;

export const config = { runtime: "edge" };

export default async function handler(req) {
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

  try {
    const { messages, system, useWebSearch = true } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "messages مطلوبة" }, { status: 400 });
    }

    const tools = useWebSearch
      ? [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }]
      : undefined;

    const params = {
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: system || DEFAULT_SYSTEM,
      messages,
    };

    if (tools) {
      params.tools = tools;
      params.betas = ["web-search-2025-03-05"];
    }

    const response = await client.messages.create(params);

    return Response.json(response, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return Response.json(
      { error: e.message || "خطأ غير معروف في الخادم" },
      { status: 500 }
    );
  }
}
