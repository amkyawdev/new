import { initializeApp } from "https://www.gstatic.com/firebasejs/13.6.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.6.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/13.6.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById("loginForm");
const loginSection = document.getElementById("login-section");
const feedSection = document.getElementById("feed-section");
const feed = document.getElementById("feed");
const logoutBtn = document.getElementById("logoutBtn");

// Mock posts (will replace with Firestore later)
let posts = [
  { id: 1, user: "Aung Myo Kyaw", text: "Hello World!" },
  { id: 2, user: "Friend", text: "My first post" }
];

// Render posts
function renderPosts() {
  feed.innerHTML = "";
  posts.forEach(post => {
    const div = document.createElement("div");
    div.classList.add("post");
    div.innerHTML = `<strong>${post.user}</strong><p>${post.text}</p>`;
    feed.appendChild(div);
  });
}

// Login Form Submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm[0].value;
  const password = loginForm[1].value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Logged in:", userCredential.user);
    loginSection.classList.add("hidden");
    feedSection.classList.remove("hidden");
    renderPosts();
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  loginSection.classList.remove("hidden");
  feedSection.classList.add("hidden");
});
