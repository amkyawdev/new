// assets/js/app.js
import { auth, db, googleProvider } from '../../config/firebase-config.js';
import { 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
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
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initRouter } from './router.js';
import { initTheme } from './theme.js';
import { initChatbot } from './chatbot.js';
import { initDownload, downloadProject, uploadProject } from './download.js';
import { ENV, DEBUG } from '../../config/env.js';

class BurmeApp {
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.notifications = [];
        this.modals = {};
        this.eventListeners = {};
        this.pageTransition = false;
        
        // Initialize app
        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showLoading();
            
            // Initialize components
            await this.loadComponents();
            initTheme();
            initRouter();
            initChatbot();
            initDownload();
            
            // Initialize animations
            this.initAnimations();
            
            // Initialize event listeners
            this.initEventListeners();
            
            // Check auth state
            this.initAuth();
            
            // Hide loading screen
            this.hideLoading();
            
            // Log initialization
            if (DEBUG) {
                console.log(`🚀 ${ENV.APP_NAME} v${ENV.APP_VERSION} initialized`);
            }
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showNotification('Failed to initialize app. Please refresh.', 'error');
        }
    }

    showLoading() {
        const loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.className = 'fixed inset-0 bg-dark bg-opacity-90 z-[9999] flex items-center justify-center';
        loader.innerHTML = `
            <div class="text-center">
                <div class="loader mb-4"></div>
                <h3 class="text-xl font-bold gradient-text animate-pulse">Loading ${ENV.APP_NAME}...</h3>
                <p class="text-secondary mt-2">Preparing your coding environment</p>
            </div>
        `;
        document.body.appendChild(loader);
    }

    hideLoading() {
        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
    }

    async loadComponents() {
        const components = ['navbar', 'sidebar', 'chatbot'];
        
        try {
            await Promise.all(components.map(async (component) => {
                const response = await fetch(`/components/${component}.html`);
                if (response.ok) {
                    const html = await response.text();
                    const element = document.getElementById(component);
                    if (element) {
                        element.innerHTML = html;
                        
                        // Trigger component loaded event
                        this.triggerEvent(`${component}Loaded`);
                    }
                }
            }));
        } catch (error) {
            console.warn('Some components failed to load:', error);
        }
    }

    initAuth() {
        // Listen for auth state changes
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.handleUserSignIn(user);
            } else {
                this.handleUserSignOut();
            }
        });

        // Google Sign In
        document.addEventListener('click', async (e) => {
            const signInBtn = e.target.closest('#google-signin');
            if (signInBtn) {
                e.preventDefault();
                await this.googleSignIn();
            }

            const signOutBtn = e.target.closest('#signout');
            if (signOutBtn) {
                e.preventDefault();
                await this.signOut();
            }
        });
    }

    async googleSignIn() {
        try {
            this.showNotification('Connecting to Google...', 'info');
            
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Save user to Firestore
            await this.saveUserToFirestore(user);
            
            this.showNotification(`Welcome ${user.displayName}! 🎉`, 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
            
        } catch (error) {
            console.error('Sign in error:', error);
            
            let message = 'Failed to sign in. ';
            if (error.code === 'auth/popup-closed-by-user') {
                message += 'Popup was closed.';
            } else if (error.code === 'auth/cancelled-popup-request') {
                message += 'Another popup is already open.';
            } else {
                message += error.message;
            }
            
            this.showNotification(message, 'error');
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            this.showNotification('Signed out successfully', 'info');
            
            // Redirect to home
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
            
        } catch (error) {
            this.showNotification('Failed to sign out: ' + error.message, 'error');
        }
    }

    async saveUserToFirestore(user) {
        const userRef = doc(db, 'users', user.uid);
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        try {
            await updateDoc(userRef, userData);
        } catch (error) {
            // User doesn't exist, create new
            await addDoc(collection(db, 'users'), {
                ...userData,
                createdAt: serverTimestamp(),
                projectCount: 0,
                settings: {
                    theme: 'dark',
                    fontSize: 14,
                    autoSave: true
                }
            });
        }
    }

    handleUserSignIn(user) {
        this.currentUser = user;
        
        // Update UI
        document.querySelectorAll('.auth-required').forEach(el => {
            el.classList.remove('hidden');
            el.style.display = 'block';
        });
        
        document.querySelectorAll('.guest-only').forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none';
        });
        
        // Update user info
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        
        if (userAvatar) {
            userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=4f46e5&color=fff`;
        }
        
        if (userName) {
            userName.textContent = user.displayName || 'User';
        }
        
        if (userEmail) {
            userEmail.textContent = user.email || '';
        }
        
        // Load user projects
        this.loadUserProjects();
        
        // Trigger event
        this.triggerEvent('userSignedIn', user);
    }

    handleUserSignOut() {
        this.currentUser = null;
        this.projects = [];
        
        // Update UI
        document.querySelectorAll('.auth-required').forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.guest-only').forEach(el => {
            el.classList.remove('hidden');
            el.style.display = 'block';
        });
        
        // Trigger event
        this.triggerEvent('userSignedOut');
    }

    async loadUserProjects() {
        if (!this.currentUser) return;
        
        try {
            this.showNotification('Loading your projects...', 'info');
            
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
            
            this.showNotification(`Loaded ${this.projects.length} projects`, 'success');
            
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showNotification('Failed to load projects', 'error');
        }
    }

    renderProjects() {
        const projectsContainer = document.getElementById('projects-list');
        if (!projectsContainer) return;
        
        if (this.projects.length === 0) {
            projectsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="glass-card p-8">
                        <i class="fas fa-folder-open text-5xl text-secondary mb-4"></i>
                        <h3 class="text-2xl font-bold mb-2">No projects yet</h3>
                        <p class="text-secondary mb-6">Create your first project to get started</p>
                        <button onclick="app.showNewProjectModal()" class="btn-primary">
                            <i class="fas fa-plus mr-2"></i>Create Project
                        </button>
                    </div>
                </div>
            `;
            return;
        }
        
        projectsContainer.innerHTML = this.projects.map((project, index) => `
            <div class="project-card animate-slide-up" style="animation-delay: ${index * 0.1}s" 
                 onclick="window.location.href='/editor.html?id=${project.id}'">
                
                <div class="flex items-start justify-between mb-4">
                    <div class="project-icon">
                        <i class="fas ${this.getProjectIcon(project.type)} text-2xl text-primary"></i>
                    </div>
                    
                    <div class="dropdown">
                        <button class="btn-icon" onclick="event.stopPropagation(); app.toggleProjectMenu('${project.id}')">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        
                        <div id="menu-${project.id}" class="dropdown-menu hidden">
                            <button onclick="event.stopPropagation(); app.renameProject('${project.id}')">
                                <i class="fas fa-edit mr-2"></i>Rename
                            </button>
                            <button onclick="event.stopPropagation(); app.duplicateProject('${project.id}')">
                                <i class="fas fa-copy mr-2"></i>Duplicate
                            </button>
                            <button onclick="event.stopPropagation(); app.downloadProject('${project.id}')">
                                <i class="fas fa-download mr-2"></i>Download
                            </button>
                            <hr class="border-glass-border my-2">
                            <button onclick="event.stopPropagation(); app.deleteProject('${project.id}')" 
                                    class="text-red-500">
                                <i class="fas fa-trash mr-2"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="project-info">
                    <h3 class="text-xl font-bold mb-1">${project.name}</h3>
                    <p class="text-sm text-secondary mb-3">
                        <i class="fas fa-clock mr-1"></i>
                        ${this.formatDate(project.updatedAt)}
                    </p>
                    
                    <div class="flex flex-wrap gap-2">
                        <span class="px-2 py-1 text-xs rounded-full bg-primary bg-opacity-20 text-primary">
                            <i class="fas ${this.getFileIcon('html')} mr-1"></i>
                            ${Object.keys(project.files || {}).length} files
                        </span>
                        
                        <span class="px-2 py-1 text-xs rounded-full bg-secondary bg-opacity-20 text-secondary">
                            <i class="fas fa-code mr-1"></i>
                            ${project.type || 'web'}
                        </span>
                    </div>
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
            'default': 'fa-code'
        };
        return icons[type] || icons.default;
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop();
        const icons = {
            'html': 'fa-html5',
            'css': 'fa-css3-alt',
            'js': 'fa-js',
            'jsx': 'fa-react',
            'ts': 'fa-typescript',
            'json': 'fa-file-code',
            'md': 'fa-markdown',
            'py': 'fa-python',
            'php': 'fa-php',
            'java': 'fa-java',
            'cpp': 'fa-cplusplus',
            'default': 'fa-file'
        };
        return icons[ext] || icons.default;
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
                description: '',
                files: this.getDefaultFiles(type),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                settings: {
                    theme: 'dark',
                    fontSize: 14,
                    autoSave: true
                },
                tags: []
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
            
            this.showNotification('Project created successfully! 🎉', 'success');
            
            // Redirect to editor
            setTimeout(() => {
                window.location.href = `/editor.html?id=${docRef.id}`;
            }, 1000);
            
        } catch (error) {
            console.error('Error creating project:', error);
            this.showNotification('Failed to create project: ' + error.message, 'error');
        }
    }

    getDefaultFiles(type) {
        const files = {
            'web': {
                'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <h1>Hello, Burme AI! 👋</h1>
    <script src="script.js"></script>
</body>
</html>`,
                'style.css': `/* Reset CSS */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

h1 {
    font-size: 3rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    animation: fadeIn 1s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}`,
                'script.js': `// Welcome to Burme AI!
console.log('Hello, World!');

// Your code here
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded!');
});`
            },
            'react': {
                'App.js': `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Hello from Burme AI! 🚀</h1>
    </div>
  );
}

export default App;`,
                'App.css': `.App {
  text-align: center;
  padding: 2rem;
}

h1 {
  color: #4f46e5;
  animation: fadeIn 1s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}`,
                'index.js': `import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`
            },
            'python': {
                'main.py': `#!/usr/bin/env python3
# -*- coding: utf-8 -*-

def main():
    print("Hello from Burme AI! 🐍")
    
    name = input("What's your name? ")
    print(f"Nice to meet you, {name}!")

if __name__ == "__main__":
    main()`,
                'requirements.txt': `# Add your dependencies here
# requests==2.28.1
# flask==2.2.2`
            }
        };
        
        return files[type] || files.web;
    }

    async deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }
        
        try {
            await deleteDoc(doc(db, 'projects', projectId));
            
            this.projects = this.projects.filter(p => p.id !== projectId);
            this.renderProjects();
            
            this.showNotification('Project deleted successfully', 'success');
            
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showNotification('Failed to delete project', 'error');
        }
    }

    async duplicateProject(projectId) {
        const original = this.projects.find(p => p.id === projectId);
        if (!original) return;
        
        try {
            this.showNotification('Duplicating project...', 'info');
            
            const newProject = {
                ...original,
                name: `${original.name} (Copy)`,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            delete newProject.id;
            
            const docRef = await addDoc(collection(db, 'projects'), newProject);
            
            this.projects.unshift({ 
                id: docRef.id, 
                ...newProject,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            this.renderProjects();
            this.showNotification('Project duplicated successfully', 'success');
            
        } catch (error) {
            console.error('Error duplicating project:', error);
            this.showNotification('Failed to duplicate project', 'error');
        }
    }

    async downloadProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        
        await downloadProject(project);
    }

    showNewProjectModal() {
        const modal = document.getElementById('new-project-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('open');
            
            // Focus input
            setTimeout(() => {
                document.getElementById('project-name')?.focus();
            }, 100);
        }
    }

    hideNewProjectModal() {
        const modal = document.getElementById('new-project-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('open');
        }
    }

    toggleProjectMenu(projectId) {
        const menu = document.getElementById(`menu-${projectId}`);
        if (menu) {
            menu.classList.toggle('hidden');
            
            // Close other menus
            document.querySelectorAll('.dropdown-menu').forEach(m => {
                if (m.id !== `menu-${projectId}`) {
                    m.classList.add('hidden');
                }
            });
        }
    }

    showNotification(message, type = 'info') {
        const id = 'notification-' + Date.now();
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification ${type} animate-slide-down`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas ${icons[type]}"></i>
                </div>
                <div class="notification-message flex-1">${message}</div>
                <button class="notification-close ml-2" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-progress"></div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const notif = document.getElementById(id);
            if (notif) {
                notif.style.opacity = '0';
                setTimeout(() => notif.remove(), 300);
            }
        }, 5000);
        
        // Store notification
        this.notifications.push({ id, message, type });
    }

    initEventListeners() {
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideNewProjectModal();
                
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });
        
        // Handle online/offline
        window.addEventListener('online', () => {
            this.showNotification('You are back online!', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may be limited.', 'warning');
        });
        
        // Handle page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Refresh data when user returns
                if (this.currentUser) {
                    this.loadUserProjects();
                }
            }
        });
    }

    initAnimations() {
        // Page transition
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
                    
                    // Animate numbers
                    if (entry.target.classList.contains('stat-number')) {
                        this.animateNumber(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.animate-on-scroll, .stat-number, .card').forEach(el => {
            observer.observe(el);
        });
    }

    animateNumber(element) {
        const target = parseInt(element.getAttribute('data-target') || element.textContent.replace(/[^0-9]/g, ''));
        if (isNaN(target)) return;
        
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current).toLocaleString();
        }, 20);
    }

    triggerEvent(eventName, data = null) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
        
        if (DEBUG) {
            console.log(`📢 Event triggered: ${eventName}`, data);
        }
    }

    on(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
        
        document.addEventListener(eventName, callback);
    }

    off(eventName, callback) {
        document.removeEventListener(eventName, callback);
    }

    async resetPassword(email) {
        if (!email) {
            this.showNotification('Please enter your email', 'warning');
            return;
        }
        
        try {
            await sendPasswordResetEmail(auth, email);
            this.showNotification('Password reset email sent! Check your inbox.', 'success');
        } catch (error) {
            console.error('Password reset error:', error);
            
            let message = 'Failed to send reset email. ';
            if (error.code === 'auth/user-not-found') {
                message += 'Email not found.';
            } else {
                message += error.message;
            }
            
            this.showNotification(message, 'error');
        }
    }

    async uploadProject() {
        await uploadProject();
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserProjects() {
        return this.projects;
    }

    getProjectById(projectId) {
        return this.projects.find(p => p.id === projectId);
    }
}

// Create global app instance
window.app = new BurmeApp();

// Export for module usage
export default window.app;