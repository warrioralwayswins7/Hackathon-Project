CareMesh AI — शुरू करने के आसान निर्देश (Windows + VS Code)

1. ZIP को Extract करें। अंदर CareMesh-AI नाम का folder मिलेगा।
2. VS Code खोलें → File → Open Folder → CareMesh-AI folder चुनें।
3. Project folder में terminal खोलें और `npm install` चलाएँ।
4. `frontend/.env` में frontend URL (`http://localhost:3000`) और `backend/.env` में backend URL (`http://localhost:3000`) अलग-अलग दिए गए हैं। Doctor AI का API endpoint `http://localhost:3000/api/doctorAi` है। Doctor AI के लिए अपनी निजी `OPENAI_API_KEY` `backend/.env` में uncomment करके जोड़ें। पुरानी root `.env` भी fallback के रूप में पढ़ी जाती है। API key को frontend files में न रखें।
5. `npm start` चलाएँ और `http://localhost:3000` खोलें।
6. Dashboard खुलेगा और sample demo records दिखेंगे।
7. Patients / Follow-up tasks / Appointments / Referrals / Labs & pharmacy में Add/Create बटन से demo records बनाएँ।
8. Alerts & escalations खोलें और Run checks दबाएँ।
9. Demo role बदलकर UI permission behavior देख सकते हैं; यह असली login/authentication नहीं है।
10. Export JSON से demo data export कर सकते हैं। Data इसी browser के localStorage में है।

फाइलें:
- frontend/index.html: page structure और forms
- frontend/style.css: design/mobile layout
- frontend/app.js: navigation, forms, buttons, search/filter
- frontend/backend.js: browser localStorage demo data adapter (यह server backend नहीं है)
- frontend/workflows.js: overdue tasks, missed appointments, referral/lab और consent checks
- frontend/ai.js: rule-based summary/priority suggestions; generative medical AI नहीं
- frontend/security.js: UI demo role checks; असली सुरक्षा नहीं
- frontend/config.js: browser Firebase configuration
- backend/server.js: Express API और frontend file server
- backend/.env: private server-side environment settings; इसे साझा न करें
- frontend/.env.example: static frontend के लिए env-file/security जानकारी
- frontend/archive और backend/archive: पुराने snapshots, runtime में उपयोग नहीं होते

महत्वपूर्ण:
- अभी असली मरीजों की जानकारी न डालें।
- यह prototype है, production clinical system नहीं। Emergency monitoring या diagnosis के लिए इसका उपयोग न करें।
- Firebase जोड़ने पर Authentication, Firestore schema, Security Rules, server-side authorization, consent audit, backup और tests लागू करने होंगे। Browser code में private service-account key कभी न रखें।
- Firebase जोड़ने पर कुछ backend code/config बदलना पड़ेगा; किसी भी prototype में बिना बदलाव की गारंटी नहीं दी जा सकती, लेकिन इस structure से बदलाव सीमित रखे गए हैं।
