const loginForm = document.getElementById("loginForm");
const loginSection = document.getElementById("login-section");
const feedSection = document.getElementById("feed-section");
const feed = document.getElementById("feed");

// Mock posts
const posts = [
  { id: 1, user: "Aung Myo Kyaw", text: "Hello World!" },
  { id: 2, user: "Friend", text: "My first post" }
];

loginForm.addEventListener("submit", function(e) {
  e.preventDefault();
  // Simple login simulation
  loginSection.classList.add("hidden");
  feedSection.classList.remove("hidden");
  renderPosts();
});

function renderPosts() {
  feed.innerHTML = "";
  posts.forEach(post => {
    const div = document.createElement("div");
    div.classList.add("post");
    div.innerHTML = `<strong>${post.user}</strong><p>${post.text}</p>`;
    feed.appendChild(div);
  });
}
