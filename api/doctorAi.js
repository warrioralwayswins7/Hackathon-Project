const dotenv = require("dotenv");
const OpenAI = require("openai");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", "backend", ".env") });
dotenv.config();

const languageNames = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali"
};

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const question = req.body?.question;
    const language = req.body?.language || "en";

    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 1500
    ) {
      return res.status(400).json({
        error: "Please enter a question under 1500 characters."
      });
    }

    const supportedLanguages = ["en", "hi", "ta", "te", "bn"];
    const selectedLanguage = supportedLanguages.includes(language)
      ? language
      : "en";

    const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "AI is not configured. Add OPENAI_API_KEY or GROQ_API_KEY in environment variables."
      });
    }

    const isGroq = apiKey.startsWith("gsk_");
    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: isGroq ? "https://api.groq.com/openai/v1" : undefined
    });

    const defaultModel = isGroq ? "llama-3.3-70b-versatile" : "gpt-4o-mini";
    const configuredModel = process.env.OPENAI_MODEL;
    const model =
      isGroq && (!configuredModel || configuredModel.startsWith("gpt"))
        ? "llama-3.3-70b-versatile"
        : configuredModel || defaultModel;

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content:
            "You provide general health education only. Reply in " +
            languageNames[selectedLanguage] +
            ". Do not claim to diagnose, prescribe medicines, or replace " +
            "a licensed healthcare professional. Encourage professional " +
            "care for personal medical concerns. For emergencies, advise " +
            "contacting local emergency services. Do not request identifying " +
            "patient information."
        },
        {
          role: "user",
          content: question.trim()
        }
      ],
      max_tokens: 500
    });

    const answer = completion.choices[0]?.message?.content || "";
    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Doctor AI request failed:", error.message);
    return res.status(500).json({
      error: "The AI service could not answer. Please try again."
    });
  }
};
