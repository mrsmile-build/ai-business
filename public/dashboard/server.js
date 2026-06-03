
const fetch = require("node-fetch");

const keys = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.OPENROUTER_API_KEY
];

let keyIndex = 0;

function getKey() {
  const key = keys[keyIndex];
  keyIndex = (keyIndex + 1) % keys.length;
  return key;
}

app.post("/api/ai-reply", async (req, res) => {
  try {
    const { name, message } = req.body;

    const prompt = `
You are a professional business assistant.

Write a short, polite, high-converting reply to this customer:

Name: ${name}
Message: ${message}

Make it friendly, confident, and sales-focused.
Keep it under 120 words.
`;

    const apiKey = getKey();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-70b-versatile",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    const aiText = data.choices?.[0]?.message?.content;

    res.json({ reply: aiText });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

