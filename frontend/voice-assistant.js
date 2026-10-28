
/* CareMesh AI Voice Assistant — browser-based speech */
(() => {
  function startVoiceAssistant() {
    if (document.getElementById("caremeshVoiceButton")) return;

    const style = document.createElement("style");
    style.textContent = `
      #caremeshVoiceButton {
        position:fixed; right:20px; bottom:22px; z-index:9999;
        border:0; border-radius:30px; padding:13px 18px;
        background:#176b52; color:white; font-weight:700;
        cursor:pointer; box-shadow:0 3px 12px #0003;
      }
      #caremeshVoicePanel {
        position:fixed; right:20px; bottom:82px; z-index:9999;
        width:min(340px,calc(100vw - 40px)); padding:16px;
        background:white; color:#202020; border:1px solid #ddd;
        border-radius:14px; box-shadow:0 5px 22px #0003;
        font:14px/1.5 Arial,sans-serif;
      }
      #caremeshVoicePanel button {
        border:0; border-radius:8px; padding:10px 12px;
        margin:5px 5px 5px 0; cursor:pointer;
      }
      #caremeshVoiceListen { background:#176b52;color:white; }
      #caremeshVoiceStop { background:#eee;color:#222; }
      #caremeshVoiceStatus { color:#176b52; margin:10px 0; }
      #caremeshVoiceAnswer { white-space:pre-wrap; overflow-wrap:anywhere; }
    `;
    document.head.appendChild(style);

    const button = document.createElement("button");
    button.id = "caremeshVoiceButton";
    button.textContent = "🎙️ Voice Assistant";
    button.setAttribute("aria-label", "Open voice assistant");
    document.body.appendChild(button);

    const panel = document.createElement("section");
    panel.id = "caremeshVoicePanel";
    panel.hidden = true;
    panel.innerHTML = `
      <strong>CareMesh AI — Voice Assistant</strong>
      <p>Follow-ups, referrals aur pending tasks ke baare mein poochhein.</p>
      <button id="caremeshVoiceListen" type="button">🎙️ Bolna shuru karein</button>
      <button id="caremeshVoiceStop" type="button">⏹ Rokein</button>
      <p id="caremeshVoiceStatus" role="status">Ready</p>
      <div id="caremeshVoiceAnswer" aria-live="polite"></div>
      <p><small>Demo assistant: patient ke clinical decisions ke liye authorised medical staff se confirm karein.</small></p>
    `;
    document.body.appendChild(panel);

    button.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
    });

    const status = panel.querySelector("#caremeshVoiceStatus");
    const answerBox = panel.querySelector("#caremeshVoiceAnswer");
    const listenButton = panel.querySelector("#caremeshVoiceListen");
    const stopButton = panel.querySelector("#caremeshVoiceStop");

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    function speak(text) {
      if (!("speechSynthesis" in window)) {
        status.textContent = "Is browser mein voice response supported nahi hai.";
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }

    function answerQuestion(rawQuestion) {
      const question = rawQuestion.toLowerCase();
      let answer = "";

      if (/task|follow.?up|pending|overdue|लेट|बाकी|फॉलो|टास्क/.test(question)) {
        try {
          const report = window.CareAI?.analyse();
          if (report) {
            answer =
              `Open tasks: ${report.openTasks}. ` +
              `Overdue tasks: ${report.overdue}. ` +
              `Pending referrals: ${report.referrals}. ` +
              `Incomplete lab or pharmacy items: ${report.labs}. ` +
              `Consent needs review: ${report.consent}.`;
          }
        } catch (error) {
          console.error("Voice assistant analysis error:", error);
        }
      }

      if (!answer && /referral|रेफरल|hospital|अस्पताल/.test(question)) {
        answer = "Referrals section kholein aur referral ka status aur receiving hospital se receipt confirm karein.";
      }

      if (!answer && /consent|permission|अनुमति|सहमति/.test(question)) {
        answer = "Patient ki consent aur access permissions verify karein. Bina authorised permission ke patient details share na karein.";
      }

      if (!answer && /hello|hi|नमस्ते|हेलो/.test(question)) {
        answer = "Namaste! Main CareMesh AI coordination assistant hoon. Aap pending tasks, follow-ups ya referrals ke baare mein pooch sakte hain.";
      }

      if (!answer) {
        answer = "Main abhi coordination ke basic sawalon mein madad kar sakta hoon. Pending tasks, overdue follow-ups, referrals ya patient consent ke baare mein poochhein.";
      }

      answerBox.textContent = answer;
      status.textContent = "Jawab taiyar hai.";
      speak(answer);
    }

    listenButton.addEventListener("click", () => {
      if (!SpeechRecognition) {
        status.textContent =
          "Speech recognition supported nahi hai. Chrome ya Edge mein try karein.";
        return;
      }

      if (recognition) recognition.abort();
      recognition = new SpeechRecognition();
      recognition.lang = "hi-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        status.textContent = "Sun raha hoon... Ab boliye.";
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        answerBox.textContent = "Aapne kaha: " + transcript;
        answerQuestion(transcript);
      };

      recognition.onerror = (event) => {
        status.textContent =
          "Voice error: " + event.error +
          ". Microphone permission aur internet connection check karein.";
      };

      recognition.onend = () => {
        if (status.textContent === "Sun raha hoon... Ab boliye.") {
          status.textContent = "Listening band hui. Dobara bolne ke liye button dabayein.";
        }
      };

      try {
        recognition.start();
      } catch (error) {
        status.textContent = "Dobara try karein.";
      }
    });

    stopButton.addEventListener("click", () => {
      if (recognition) recognition.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      status.textContent = "Voice band hai.";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startVoiceAssistant);
  } else {
    startVoiceAssistant();
  }
})();
