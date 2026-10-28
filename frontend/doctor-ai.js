
(() => {
  const suggestions = {
    en: [
      "What questions should I ask my doctor?",
      "How can I prepare for a medical appointment?"
    ],
    hi: [
      "डॉक्टर से कौन से सवाल पूछने चाहिए?",
      "डॉक्टर की अपॉइंटमेंट की तैयारी कैसे करें?"
    ],
    ta: [
      "மருத்துவரிடம் என்ன கேள்விகள் கேட்கலாம்?",
      "மருத்துவ சந்திப்பிற்கு எப்படித் தயாராவது?"
    ],
    te: [
      "డాక్టర్‌ను ఏ ప్రశ్నలు అడగాలి?",
      "వైద్య అపాయింట్‌మెంట్‌కు ఎలా సిద్ధం కావాలి?"
    ],
    bn: [
      "ডাক্তারকে কী কী প্রশ্ন করা উচিত?",
      "চিকিৎসকের অ্যাপয়েন্টমেন্টের জন্য কীভাবে প্রস্তুত হব?"
    ]
  };

  const language = document.getElementById("doctorLanguage");
  const suggestionBox = document.getElementById("doctorSuggestions");
  const form = document.getElementById("doctorForm");
  const question = document.getElementById("doctorQuestion");
  const messages = document.getElementById("doctorMessages");
  const status = document.getElementById("doctorStatus");
  const send = document.getElementById("doctorSend");

  if (!language || !suggestionBox || !form ||
      !question || !messages || !status || !send) {
    console.error("Doctor AI elements not found.");
    return;
  }

  function addMessage(text, type) {
    const item = document.createElement("div");
    item.className = "doctor-message " +
      (type === "user" ? "user-message" : "assistant-message");
    item.textContent = text;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function showSuggestions() {
    suggestionBox.replaceChildren();

    (suggestions[language.value] || suggestions.en).forEach(text => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = text;

      button.addEventListener("click", () => {
        question.value = text;
        question.focus();
      });

      suggestionBox.appendChild(button);
    });
  }

  language.addEventListener("change", showSuggestions);
  showSuggestions();

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const q = question.value.trim();
    if (!q) return;

    addMessage(q, "user");
    question.value = "";
    send.disabled = true;
    status.textContent = "जवाब प्राप्त किया जा रहा है...";

    try {
      const response = await fetch("/api/doctorAi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          question: q,
          language: language.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI service unavailable");
      }

      const answer = data.answer || data.response;

      if (typeof answer !== "string" || !answer.trim()) {
        throw new Error("No answer returned");
      }

      addMessage(answer, "assistant");
      status.textContent = "जवाब मिल गया।";
    } catch (error) {
      status.textContent =
        "AI सेवा उपलब्ध नहीं है। कृपया बाद में फिर प्रयास करें।";
    } finally {
      send.disabled = false;
    }
  });
})();
