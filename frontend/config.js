/* Life Saviour Firebase Configuration */
window.CAREMESH_CONFIG = Object.freeze({
  appName: "Life Saviour",
  dataMode: "local-demo",
  firebaseEnabled: true,
  firebaseConfig: {
    apiKey: "AIzaSyCSAOPX2Z3QADnzRwrUdb2rWeeYlYwS1uU",
    authDomain: "life-saviour-32533.firebaseapp.com",
    projectId: "life-saviour-32533",
    storageBucket: "life-saviour-32533.firebasestorage.app",
    messagingSenderId: "815250952597",
    appId: "1:815250952597:web:5c14d7606a7e9f69fa269c",
    measurementId: "G-FS5P63ZMR6"
  },
  aiMode: "rule-based",
  schemaVersion: 1
});

/* Initialize Firebase once */
if (window.CAREMESH_CONFIG.firebaseEnabled && window.firebase) {
  if (!window.firebase.apps.length) {
    window.firebase.initializeApp(
      window.CAREMESH_CONFIG.firebaseConfig
    );
  }

  window.CAREMESH_AUTH = window.firebase.auth();
  window.CAREMESH_DB = window.firebase.firestore();

  console.log("Life Saviour Firebase Auth and Firestore initialized.");
}
