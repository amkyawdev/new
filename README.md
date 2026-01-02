# Aung Myo Kyaw – Personal and Social Website

> A fully responsive personal and social website built with HTML, CSS, and JavaScript, hosted on GitHub Pages.

---

## 🔹 Project Overview

This project is a **personal and social platform** that allows users to:

- Login and register
- View a newsfeed with posts
- Chat with friends (personal and group chat)
- Access user profiles
- Admin overview and About page

The website is **mobile-first and responsive**, designed to work seamlessly on both desktop and mobile devices. It is also prepared for future integration with Firebase and MongoDB for real-time data handling.

---

## 🔹 Features

### Core Features
- Beautiful login and registration forms
- Interactive newsfeed with post cards
- Personal and group chat (UI ready)
- Admin panel for managing users and content
- Responsive layout for mobile and desktop
- Simple JavaScript logic for interactivity
- Easy to extend with Firebase or other backend APIs

### Future Features
- Real-time messaging using Firebase Realtime Database
- User authentication and role management
- Image and media posts
- Notifications and alerts

---

## 🔹 Project Structure
```
burmeweb.github.io/
│
├── index.html                 # Landing / Home / Login page
├── README.md                  # Project description, setup, screenshots
│
├── pages/                     # Secondary pages
│   ├── login.html
│   ├── register.html
│   ├── feed.html
│   ├── chat.html
│   ├── group.html
│   ├── profile.html
│   ├── admin.html
│   └── about.html
│
├── assets/                    # All static assets
│   ├── css/
│   │   ├── base.css           # Reset and global styles
│   │   ├── layout.css         # Sidebar, navbar, grid
│   │   ├── components.css     # Buttons, cards, forms
│   │   ├── theme.css          # Colors, dark/light mode
│   │   └── mobile.css         # Responsive media queries
│   │
│   ├── js/
│   │   ├── app.js             # App initialization
│   │   ├── auth.js            # Login/Register logic
│   │   ├── feed.js            # Newsfeed logic
│   │   ├── chat.js            # Personal chat logic
│   │   ├── group.js           # Group chat logic
│   │   ├── admin.js           # Admin panel logic
│   │   ├── ui.js              # UI interactions / DOM updates
│   │   └── storage.js         # LocalStorage / mock data / future API
│   │
│   ├── img/
│   │   ├── logo.png
│   │   └── icons/             # SVGs / PNGs for UI
│   │
│   └── fonts/                  # Custom fonts
│
├── data/                       # Mock / JSON data
│   ├── users.json
│   ├── posts.json
│   ├── chats.json
│   └── groups.json
│
└── config/
    └── app.config.js           # App-wide constants / API keys / endpoints
```

## 🔹 Installation / Setup

1. Clone or download this repository:

```bash
git clone https://github.com/burmeweb/burmeweb.github.io.git
Open index.html in your browser.
The site is ready to deploy on GitHub Pages.
For live updates, push changes to the main branch.
🔹 Technologies Used
Frontend: HTML5, CSS3, JavaScript (Vanilla)
Responsive Design: Mobile-first layout, CSS Flexbox & Grid
Future Backend Integration: Firebase Authentication, Firebase Realtime Database, MongoDB
Deployment: GitHub Pages
🔹 Screenshots
�
�
�
(Add screenshots as you develop)
🔹 Author
Aung Myo Kyaw
Personal and Social Website Developer
Email: aung.thuyrain.at449@gmail.com
Phone: 09677740154
🔹 License
This project is open-source and free to use.
Copy code

---
