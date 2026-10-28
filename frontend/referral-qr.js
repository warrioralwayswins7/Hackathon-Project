(() => {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const patientSelect = document.getElementById("qrPatientId");
    const destinationInput = document.getElementById("qrDestination");
    const reasonInput = document.getElementById("qrReason");
    const expiryInput = document.getElementById("qrExpiry");
    const generateButton = document.getElementById("generateReferralQR");
    const result = document.getElementById("referralQRResult");

    if (!patientSelect || !generateButton || !result) {
      console.warn("Referral QR panel not found.");
      return;
    }

    // Populate patient list using the existing demo backend.
    try {
      const patients = window.CareBackend?.list("patients") || [];
      patientSelect.replaceChildren();

      const firstOption = document.createElement("option");
      firstOption.value = "";
      firstOption.textContent = "Choose patient";
      patientSelect.appendChild(firstOption);

      patients.forEach((patient) => {
        const option = document.createElement("option");
        option.value = patient.id;
        option.textContent = `${patient.name || "Patient"} (${patient.id})`;
        patientSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Could not load patients:", error);
    }

    generateButton.addEventListener("click", () => {
      const patientId = patientSelect.value;
      const destination = destinationInput?.value.trim() || "";
      const reason = reasonInput?.value.trim() || "";
      const expiry = expiryInput?.value || "";

      if (!patientId || !destination || !reason || !expiry) {
        result.textContent =
          "Please select a patient and fill in destination, reason, and expiry.";
        return;
      }

      if (expiry < new Date().toISOString().slice(0, 10)) {
        result.textContent = "Expiry date cannot be in the past.";
        return;
      }

      const randomPart = (window.crypto?.randomUUID
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10)
      ).toUpperCase();

      const referralCode = `RF-DEMO-${randomPart}`;

      result.replaceChildren();

      const heading = document.createElement("h4");
      heading.textContent = "Demo referral created";
      result.appendChild(heading);

      const codeText = document.createElement("p");
      codeText.textContent = `Referral code: ${referralCode}`;
      result.appendChild(codeText);

      const details = document.createElement("p");
      details.textContent =
        `Patient ID: ${patientId} | Destination: ${destination} | Reason: ${reason} | Expires: ${expiry}`;
      result.appendChild(details);

      const qrContainer = document.createElement("div");
      qrContainer.className = "qr-code";
      result.appendChild(qrContainer);

      if (typeof window.QRCode === "function") {
        new window.QRCode(qrContainer, {
          text: referralCode,
          width: 180,
          height: 180
        });
      } else {
        const note = document.createElement("p");
        note.textContent =
          "QR library did not load. Use the referral code shown above.";
        result.appendChild(note);
      }

      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "primary";
      copyButton.textContent = "Copy Referral Code";
      copyButton.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(referralCode);
          copyButton.textContent = "Copied";
        } catch {
          result.appendChild(
            document.createTextNode(" Copy this code manually: " + referralCode)
          );
        }
      });
      result.appendChild(copyButton);

      const demoNote = document.createElement("p");
      demoNote.textContent =
        "Demo only: this code is not saved as an authorised referral and does not grant access to patient records.";
      result.appendChild(demoNote);
    });
  });
})();
