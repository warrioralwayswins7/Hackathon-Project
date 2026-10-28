
/* Life Saviour - Firebase Authentication */

(function () {
  const config = window.CAREMESH_CONFIG;

  function startLogin() {
    const loginPage = document.getElementById("loginPage");
    const loginForm = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");
    const googleButton = document.getElementById("googleLoginBtn");
    const signupButton = document.getElementById("signupBtn");
    const errorBox = document.getElementById("loginError");

    if (!loginPage || !loginForm || !window.CAREMESH_AUTH) {
      console.error("Login page or Firebase Auth is not ready.");
      return;
    }

    const auth = window.CAREMESH_AUTH;
    const appElements = document.querySelectorAll("body > aside, body > main");

    function showError(message) {
      errorBox.textContent = message;
    }

    function showApp(isLoggedIn) {
      appElements.forEach(function (element) {
        element.style.display = isLoggedIn ? "" : "none";
      });

      loginPage.style.display = isLoggedIn ? "none" : "block";
    }

    loginForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      showError("");

      try {
        await auth.signInWithEmailAndPassword(
          emailInput.value.trim(),
          passwordInput.value
        );
      } catch (error) {
        showError(error.message || "Login नहीं हो पाया।");
      }
    });

    googleButton.addEventListener("click", async function () {
      showError("");

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
      } catch (error) {
        showError(error.message || "Google Login नहीं हो पाया।");
      }
    });

    signupButton.addEventListener("click", async function () {
      showError("");

      try {
        await auth.createUserWithEmailAndPassword(
          emailInput.value.trim(),
          passwordInput.value
        );
      } catch (error) {
        showError(error.message || "Account नहीं बन पाया।");
      }
    });

    showApp(false);

    auth.onAuthStateChanged(function (user) {
      showApp(Boolean(user));
      showError("");
    });
  }

  if (
    window.CAREMESH_CONFIG &&
    window.CAREMESH_CONFIG.firebaseEnabled &&
    window.firebase
  ) {
    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(
        window.CAREMESH_CONFIG.firebaseConfig
      );
    }

    window.CAREMESH_AUTH = window.firebase.auth();

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", startLogin);
    } else {
      startLogin();
    }
  } else {
    console.error("Firebase configuration is not enabled.");
  }
})();
