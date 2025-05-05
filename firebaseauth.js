const FIREBASE_VERSION = "11.6.1"; // This variable is now just for reference, not used in imports directly

// Corrected import statements using static string paths
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, setDoc, doc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyCppeBOjRp0MSA1EF714hOgYKgZTeNsrQY", // Keep your actual API key
  authDomain: "log-in-a6af9.firebaseapp.com",
  projectId: "log-in-a6af9",
  storageBucket: "log-in-a6af9.appspot.com", // Corrected .appspot.com suffix typical for storageBucket
  messagingSenderId: "407902316470",
  appId: "1:407902316470:web:bfcfd8469971d1d0c30317"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Get auth instance once
const db = getFirestore(app); // Get firestore instance once

/**
 * Displays a message in a specific div and fades it out.
 * @param {string} message - The message text to display.
 * @param {string} divId - The ID of the div element to display the message in.
 */
function showMessage(message, divId) {
  const messageDiv = document.getElementById(divId);
  if (messageDiv) { // Check if element exists
    messageDiv.style.display = "block";
    messageDiv.innerHTML = message;
    messageDiv.style.opacity = 1;
    // Clear previous timeouts if any
    if (messageDiv.timeoutId) {
        clearTimeout(messageDiv.timeoutId);
    }
    messageDiv.timeoutId = setTimeout(() => {
      messageDiv.style.opacity = 0;
      // Optionally hide completely after fade out
      // setTimeout(() => { messageDiv.style.display = "none"; }, 500);
    }, 5000); // Message visible for 5 seconds
  } else {
      console.error(`Element with ID "${divId}" not found.`);
  }
}

// --- Sign Up Logic ---
const signUpButton = document.getElementById('signUp');
const signUpForm = document.getElementById('signup-form'); // Get form reference

if (signUpButton && signUpForm) {
  signUpForm.addEventListener('submit', (event) => { // Listen on form submit
    event.preventDefault(); // Prevent default form submission

    const nameInput = document.getElementById('rname');
    const emailInput = document.getElementById('remail');
    const passwordInput = document.getElementById('rpassword');

    // Basic validation (optional, but recommended)
    if (!nameInput.value || !emailInput.value || !passwordInput.value) {
        showMessage('Please fill in all fields.', 'signUpMessage');
        return;
    }

    const name = nameInput.value;
    const email = emailInput.value;
    const password = passwordInput.value;

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('User created:', user.uid);
        const userData = {
          email: email,
          name: name,
          createdAt: new Date() // Optional: add a timestamp
        };

        // Save user data to Firestore
        const docRef = doc(db, "users", user.uid);
        return setDoc(docRef, userData); // Return the promise
      })
      .then(() => {
        console.log("User data saved to Firestore.");
        showMessage('Account Created Successfully! Redirecting...', 'signUpMessage');
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html'; // Redirect to a dashboard page
        }, 1500);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Sign Up Error:", errorCode, errorMessage);

        if (errorCode === 'auth/email-already-in-use') {
          showMessage('Email Address Already Exists!', 'signUpMessage');
        } else if (errorCode === 'auth/weak-password') {
          showMessage('Password is too weak (should be at least 6 characters).', 'signUpMessage');
        } else {
          showMessage('Unable to create account. Please try again.', 'signUpMessage');
        }
      });
  });
} else {
    console.error("Sign up button or form not found.");
}


// --- Login Logic ---
const logInButton = document.getElementById('logIn');
const logInForm = document.getElementById('login-form'); // Get form reference

if (logInButton && logInForm) {
  logInForm.addEventListener('submit', (event) => { // Listen on form submit
    event.preventDefault(); // Prevent default form submission

    const emailInput = document.getElementById('lemail');
    const passwordInput = document.getElementById('lpassword');

     // Basic validation (optional, but recommended)
    if (!emailInput.value || !passwordInput.value) {
        showMessage('Please enter both email and password.', 'LoginMessage');
        return;
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log('User logged in:', user.uid);
        showMessage('Login Successful! Redirecting...', 'LoginMessage');
        // Redirect to dashboard after a short delay
         setTimeout(() => {
            window.location.href = 'dashboard.html'; // Redirect to a dashboard page
        }, 1500);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error("Login Error:", errorCode, errorMessage);

        if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
            showMessage('Incorrect email or password. Please try again.', 'LoginMessage');
        } else if (errorCode === 'auth/too-many-requests') {
            showMessage('Too many login attempts. Please try again later.', 'LoginMessage');
        }
         else {
          showMessage('Unable to login. Please try again.', 'LoginMessage');
        }
      });
  });
} else {
    console.error("Log in button or form not found.");
}