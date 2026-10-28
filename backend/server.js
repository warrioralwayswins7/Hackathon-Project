const dotenv = require("dotenv");
const express = require("express");
const OpenAI = require("openai");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", "frontend", ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 3000;
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(express.json({ limit: "10kb" }));
app.use(express.static(frontendPath));

app.post("/api/doctorAi", async (req, res) => {
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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        error: "AI is not configured. Add OPENAI_API_KEY to .env."
      });
    }

    const languageNames = {
      en: "English",
      hi: "Hindi",
      ta: "Tamil",
      te: "Telugu",
      bn: "Bengali"
    };

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const result = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        "You provide general health education only. Reply in " +
        languageNames[selectedLanguage] +
        ". Do not claim to diagnose, prescribe medicines, or replace " +
        "a licensed healthcare professional. Encourage professional " +
        "care for personal medical concerns. For emergencies, advise " +
        "contacting local emergency services. Do not request identifying " +
        "patient information.",
      input: question.trim(),
      max_output_tokens: 500
    });

    res.json({ answer: result.output_text });
  } catch (error) {
    console.error("Doctor AI request failed:", error.message);
    res.status(500).json({
      error: "The AI service could not answer. Please try again."
    });
  }
});

app.listen(PORT, () => {
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${PORT}`;
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;

  console.log(`CareMesh AI frontend: ${frontendUrl}`);
  console.log(`CareMesh AI backend API: ${backendUrl}/api/doctorAi`);
});
