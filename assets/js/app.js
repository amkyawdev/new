// assets/js/app.js
import { auth, db, googleProvider } from '../../config/firebase-config.js';
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initRouter } from './router.js';
import { initTheme } from './theme.js';
import { initChatbot } from './chatbot.js';

class BurmeApp {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.init();
    }

    async init() {
        // Initialize components
        initTheme();
        initRouter();
        this.initAuth();
        this.loadComponents();
        this.initAnimations();
        
        // Check auth state
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.loadUserProjects();
                this.updateUIForUser(user);
            } else {
                this.currentUser = null;
                this.updateUIForGuest();
            }
        });
    }

    async loadComponents() {
        // Load navbar
        const navbarResponse = await fetch('/components/navbar.html');
        document.getElementById('navbar').innerHTML = await navbarResponse.text();
        
        // Load sidebar
        const sidebarResponse = await fetch('/components/sidebar.html');
        document.getElementById('sidebar').innerHTML = await sidebarResponse.text();
        
        // Load chatbot
        const chatbotResponse = await fetch('/components/chatbot.html');
        document.getElementById('chatbot').innerHTML = await chatbotResponse.text();
        
        initChatbot();
    }

    initAuth() {
        // Google Sign In
        document.addEventListener('click', async (e) => {
            if (e.target.closest('#google-signin')) {
                try {
                    const result = await signInWithPopup(auth, googleProvider);
                    this.showNotification('Successfully signed in!', 'success');
                } catch (error) {
                    this.showNotification(error.message, 'error');
                }
            }
            
            if (e.target.closest('#signout')) {
                await signOut(auth);
                this.showNotification('Signed out successfully', 'info');
            }
        });
    }

    async loadUserProjects() {
        if (!this.currentUser) return;
        
        const q = query(
            collection(db, 'projects'),
            where('userId', '==', this.currentUser.uid),
            orderBy('updatedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        this.projects = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        this.renderProjects();
    }

    renderProjects() {
        const projectsContainer = document.getElementById('projects-list');
        if (!projectsContainer) return;
        
        projectsContainer.innerHTML = this.projects.map(project => `
            <div class="project-card glass-effect animate-slide-up" onclick="window.location.href='/editor.html?id=${project.id}'">
                <div class="project-icon">
                    <i class="fas fa-code"></i>
                </div>
                <div class="project-info">
                    <h3>${project.name}</h3>
                    <p>Last updated: ${new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
                <div class="project-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); app.deleteProject('${project.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    async createNewProject(name, type) {
        if (!this.currentUser) {
            this.showNotification('Please sign in first', 'warning');
            return;
        }
        
        const project = {
            userId: this.currentUser.uid,
            name: name,
            type: type,
            files: {
                'index.html': '<!DOCTYPE html>\n<html>\n<head>\n    <title>New Project</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <script src="script.js"></script>\n</body>\n</html>',
                'style.css': 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}',
                'script.js': 'console.log("Hello World!");'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        try {
            const docRef = await addDoc(collection(db, 'projects'), project);
            this.projects.unshift({ id: docRef.id, ...project });
            this.renderProjects();
            this.showNotification('Project created successfully!', 'success');
            window.location.href = `/editor.html?id=${docRef.id}`;
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type} animate-slide-down`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getIconForType(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    getIconForType(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    initAnimations() {
        // Smooth page transitions
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
        
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        });
        
        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    }

    updateUIForUser(user) {
        document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'none');
        
        // Update user info
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (userAvatar) userAvatar.src = user.photoURL || '/assets/media/default-avatar.png';
        if (userName) userName.textContent = user.displayName || 'User';
    }

    updateUIForGuest() {
        document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.guest-only').forEach(el => el.style.display = 'block');
    }
}

// Initialize app
window.app = new BurmeApp();
