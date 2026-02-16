// assets/js/app.js
import { 
    auth, 
    db, 
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    deleteDoc,
    doc,
    updateDoc,
    serverTimestamp
} from '../../config/firebase-config.js';

import { initTheme } from './theme.js';
import { initRouter, navigateTo } from './router.js';
import { initChatbot } from './chatbot.js';

class BurmeApp {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.init();
    }
    
    async init() {
        // Initialize core modules
        initTheme();
        initRouter();
        
        // Load components
        await this.loadComponents();
        
        // Initialize auth
        this.initAuth();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Check initial auth state
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.handleUserSignIn(user);
            } else {
                this.handleUserSignOut();
            }
        });
        
        console.log('Burme App initialized');
    }
    
    async loadComponents() {
        try {
            // Load navbar
            const navbarResponse = await fetch('/components/navbar.html');
            const navbarHtml = await navbarResponse.text();
            document.getElementById('navbar').innerHTML = navbarHtml;
            
            // Load sidebar (only on editor page)
            if (window.location.pathname.includes('editor.html')) {
                const sidebarResponse = await fetch('/components/sidebar.html');
                const sidebarHtml = await sidebarResponse.text();
                document.getElementById('sidebar-container').innerHTML = sidebarHtml;
            }
            
            // Load chatbot
            const chatbotResponse = await fetch('/components/chatbot.html');
            const chatbotHtml = await chatbotResponse.text();
            document.getElementById('chatbot-container').innerHTML = chatbotHtml;
            
            // Initialize chatbot after loading
            setTimeout(() => {
                initChatbot();
            }, 500);
            
        } catch (error) {
            console.warn('Some components failed to load:', error);
        }
    }
    
    initAuth() {
        // Google Sign In
        document.addEventListener('click', async (e) => {
            const signInBtn = e.target.closest('#google-signin');
            if (signInBtn) {
                e.preventDefault();
                await this.googleSignIn();
            }
            
            const signOutBtn = e.target.closest('#signout, #mobile-signout');
            if (signOutBtn) {
                e.preventDefault();
                await this.signOut();
            }
            
            // User menu toggle
            const userMenuBtn = e.target.closest('#user-menu-btn');
            if (userMenuBtn) {
                e.preventDefault();
                const menu = document.getElementById('user-menu');
                if (menu) {
                    menu.classList.toggle('hidden');
                }
            }
            
            // Mobile menu toggle
            const mobileToggle = e.target.closest('#mobile-menu-toggle');
            if (mobileToggle) {
                e.preventDefault();
                const menu = document.getElementById('mobile-menu');
                if (menu) {
                    menu.classList.toggle('hidden');
                }
            }
            
            const closeMenu = e.target.closest('#close-menu');
            if (closeMenu) {
                const menu = document.getElementById('mobile-menu');
                if (menu) {
                    menu.classList.add('hidden');
                }
            }
        });
        
        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('user-menu');
            const userMenuBtn = document.getElementById('user-menu-btn');
            
            if (userMenu && !userMenu.classList.contains('hidden')) {
                if (!userMenu.contains(e.target) && !userMenuBtn.contains(e.target)) {
                    userMenu.classList.add('hidden');
                }
            }
        });
    }
    
    async googleSignIn() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Save user to Firestore
            await this.saveUserToFirestore(user);
            
            this.showNotification(`Welcome ${user.displayName}!`, 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                navigateTo('/dashboard.html');
            }, 1000);
            
        } catch (error) {
            console.error('Sign in error:', error);
            this.showNotification('Failed to sign in: ' + error.message, 'error');
        }
    }
    
    async signOut() {
        try {
            await signOut(auth);
            this.showNotification('Signed out successfully', 'info');
            
            setTimeout(() => {
                navigateTo('/');
            }, 1000);
            
        } catch (error) {
            this.showNotification('Failed to sign out', 'error');
        }
    }
    
    async saveUserToFirestore(user) {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                lastLogin: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            await updateDoc(userRef, userData);
        } catch (error) {
            // User doesn't exist, create new
            try {
                await addDoc(collection(db, 'users'), {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    createdAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    projectCount: 0,
                    settings: {
                        theme: 'dark',
                        fontSize: 14,
                        autoSave: true
                    }
                });
            } catch (createError) {
                console.error('Error creating user:', createError);
            }
        }
    }
    
    handleUserSignIn(user) {
        this.currentUser = user;
        
        // Update UI
        document.querySelectorAll('.auth-required').forEach(el => {
            el.classList.remove('hidden');
        });
        
        document.querySelectorAll('.guest-only').forEach(el => {
            el.classList.add('hidden');
        });
        
        // Update user info
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        
        if (userAvatar) {
            userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=4f46e5&color=fff`;
        }
        
        if (userName) {
            userName.textContent = user.displayName || 'User';
        }
        
        // Load user projects
        this.loadUserProjects();
    }
    
    handleUserSignOut() {
        this.currentUser = null;
        this.projects = [];
        
        // Update UI
        document.querySelectorAll('.auth-required').forEach(el => {
            el.classList.add('hidden');
        });
        
        document.querySelectorAll('.guest-only').forEach(el => {
            el.classList.remove('hidden');
        });
    }
    
    async loadUserProjects() {
        if (!this.currentUser) return;
        
        try {
            const q = query(
                collection(db, 'projects'),
                where('userId', '==', this.currentUser.uid),
                orderBy('updatedAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            this.projects = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date()
            }));
            
            this.renderProjects();
            
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    }
    
    renderProjects() {
        const projectsContainer = document.getElementById('projects-grid');
        if (!projectsContainer) return;
        
        if (this.projects.length === 0) {
            projectsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="glass-card p-8">
                        <i class="fas fa-folder-open text-5xl text-gray-500 mb-4"></i>
                        <h3 class="text-2xl font-bold mb-2">No projects yet</h3>
                        <p class="text-gray-400 mb-6">Create your first project to get started</p>
                        <button onclick="app.showNewProjectModal()" class="btn-primary">
                            <i class="fas fa-plus mr-2"></i>Create Project
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        projectsContainer.innerHTML = this.projects.map((project, index) => `
            <div class="project-card" onclick="window.location.href='/editor.html?id=${project.id}'" data-aos="fade-up" data-aos-delay="${index * 50}">
                <div class="project-icon">
                    <i class="fas ${this.getProjectIcon(project.type)}"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">${project.name}</h3>
                <p class="text-sm text-gray-400 mb-4">
                    <i class="fas fa-clock mr-1"></i>
                    ${this.formatDate(project.updatedAt)}
                </p>
                <div class="flex flex-wrap gap-2">
                    <span class="px-2 py-1 text-xs rounded-full bg-[#4f46e5] bg-opacity-20 text-[#4f46e5]">
                        ${project.type || 'web'}
                    </span>
                    <span class="px-2 py-1 text-xs rounded-full bg-gray-700 bg-opacity-20 text-gray-400">
                        <i class="fas fa-file mr-1"></i>
                        ${Object.keys(project.files || {}).length} files
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    getProjectIcon(type) {
        const icons = {
            'web': 'fa-globe',
            'react': 'fa-react',
            'vue': 'fa-vuejs',
            'angular': 'fa-angular',
            'python': 'fa-python',
            'node': 'fa-node',
            'html': 'fa-html5',
            'css': 'fa-css3-alt',
            'js': 'fa-js'
        };
        return icons[type] || 'fa-code';
    }
    
    formatDate(date) {
        if (!date) return 'Unknown';
        
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days < 7) return `${days} days ago`;
        
        return date.toLocaleDateString();
    }
    
    async createNewProject(name, type = 'web') {
        if (!this.currentUser) {
            this.showNotification('Please sign in first', 'warning');
            return;
        }
        
        if (!name || name.trim() === '') {
            this.showNotification('Please enter a project name', 'warning');
            return;
        }
        
        try {
            this.showNotification('Creating project...', 'info');
            
            const project = {
                userId: this.currentUser.uid,
                name: name.trim(),
                type: type,
                files: this.getDefaultFiles(type),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                settings: {
                    theme: 'dark',
                    fontSize: 14,
                    autoSave: true
                }
            };
            
            const docRef = await addDoc(collection(db, 'projects'), project);
            
            this.projects.unshift({ 
                id: docRef.id, 
                ...project,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            this.renderProjects();
            this.hideNewProjectModal();
            this.showNotification('Project created successfully!', 'success');
            
            setTimeout(() => {
                navigateTo(`/editor.html?id=${docRef.id}`);
            }, 1000);
            
        } catch (error) {
            console.error('Error creating project:', error);
            this.showNotification('Failed to create project', 'error');
        }
    }
    
    getDefaultFiles(type) {
        const files = {
            'web': {
                'index.html': `<!DOCTYPE html>
<html>
<head>
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, Burme AI!</h1>
    <script src="script.js"></script>
</body>
</html>`,
                'style.css': `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}`,
                'script.js': `console.log('Hello, World!');`
            },
            'react': {
                'App.js': `import React from 'react';

function App() {
    return <h1>Hello React!</h1>;
}

export default App;`
            },
            'python': {
                'main.py': `print("Hello, World!")`
            }
        };
        
        return files[type] || files.web;
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icons[type]} notification-icon"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    showNewProjectModal() {
        const modal = document.getElementById('new-project-modal');
        if (modal) {
            modal.classList.add('open');
        }
    }
    
    hideNewProjectModal() {
        const modal = document.getElementById('new-project-modal');
        if (modal) {
            modal.classList.remove('open');
        }
    }
    
    initEventListeners() {
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideNewProjectModal();
                
                const userMenu = document.getElementById('user-menu');
                if (userMenu) {
                    userMenu.classList.add('hidden');
                }
            }
        });
        
        // Handle online/offline
        window.addEventListener('online', () => {
            this.showNotification('You are back online!', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may be limited.', 'warning');
        });
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BurmeApp();
});

export default BurmeApp;
