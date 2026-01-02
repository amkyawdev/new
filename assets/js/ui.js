// ui.js - Complete UI Utilities and Interactions

class UIManager {
    constructor() {
        this.currentTheme = 'light';
        this.modals = new Map();
        this.notifications = [];
        
        this.init();
    }
    
    init() {
        this.loadTheme();
        this.bindEvents();
        this.setupModals();
        this.setupMobileMenu();
        this.setupTooltips();
        this.setupInfiniteScroll();
        this.setupImageLazyLoading();
        this.setupCopyToClipboard();
    }
    
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle button
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = theme === 'light' ? '🌙' : '☀️';
            toggleBtn.title = theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
        }
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    bindEvents() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Notification bell
        const notificationBell = document.querySelector('.btn-notification');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => this.showNotifications());
        }
        
        // Search functionality
        const searchInputs = document.querySelectorAll('.search-input');
        searchInputs.forEach(input => {
            input.addEventListener('input', (e) => this.handleSearch(e));
        });
        
        // Form submissions
        const forms = document.querySelectorAll('form:not(.no-ajax)');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });
        
        // Confirm dialogs
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('confirm-action')) {
                e.preventDefault();
                this.showConfirmDialog(e.target);
            }
        });
    }
    
    setupModals() {
        // Close modals on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
        
        // Close modals on background click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
        
        // Close buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close-modal')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            }
        });
    }
    
    showModal(modalId, options = {}) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} not found`);
            return;
        }
        
        // Store options
        this.modals.set(modalId, options);
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus first input if any
        setTimeout(() => {
            const firstInput = modal.querySelector('input, textarea, select');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
        // Trigger open callback
        if (options.onOpen) {
            options.onOpen();
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Get options
        const options = this.modals.get(modalId);
        
        // Hide modal
        modal.style.display = 'none';
        
        // Check if any other modals are open
        const openModals = document.querySelectorAll('.modal[style*="display: flex"]');
        if (openModals.length === 0) {
            document.body.style.overflow = 'auto';
        }
        
        // Trigger close callback
        if (options?.onClose) {
            options.onClose();
        }
        
        // Remove from map
        this.modals.delete(modalId);
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
        this.modals.clear();
    }
    
    setupMobileMenu() {
        const toggleBtn = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (!toggleBtn || !navMenu) return;
        
        toggleBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            toggleBtn.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.classList.contains('active')) return;
            
            if (!navMenu.contains(e.target) && !toggleBtn.contains(e.target)) {
                navMenu.classList.remove('active');
                toggleBtn.textContent = '☰';
            }
        });
        
        // Close menu on resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                navMenu.classList.remove('active');
                toggleBtn.textContent = '☰';
            }
        });
    }
    
    setupTooltips() {
        const elements = document.querySelectorAll('[data-tooltip]');
        
        elements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltipText = e.target.dataset.tooltip;
                if (!tooltipText) return;
                
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = tooltipText;
                
                document.body.appendChild(tooltip);
                
                // Position tooltip
                const rect = e.target.getBoundingClientRect();
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
                tooltip.style.left = (rect.left + (rect.width - tooltip.offsetWidth) / 2) + 'px';
                
                e.target._tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', (e) => {
                if (e.target._tooltip) {
                    e.target._tooltip.remove();
                    delete e.target._tooltip;
                }
            });
        });
    }
    
    setupInfiniteScroll() {
        let isLoading = false;
        
        const checkScroll = () => {
            if (isLoading) return;
            
            const scrollPosition = window.innerHeight + window.scrollY;
            const pageHeight = document.documentElement.scrollHeight;
            
            if (scrollPosition >= pageHeight - 500) {
                isLoading = true;
                this.loadMoreContent().finally(() => {
                    isLoading = false;
                });
            }
        };
        
        window.addEventListener('scroll', checkScroll);
    }
    
    async loadMoreContent() {
        // Show loading indicator
        const loader = document.createElement('div');
        loader.className = 'loading-more';
        loader.innerHTML = '<div class="spinner"></div><span>Loading more...</span>';
        
        const container = document.querySelector('.posts-feed') || 
                         document.querySelector('.messages-container') ||
                         document.querySelector('.groups-grid');
        
        if (container) {
            container.appendChild(loader);
            
            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Add more content (in real app, fetch from API)
                const newContent = this.generateMockContent();
                container.insertAdjacentHTML('beforeend', newContent);
                
            } finally {
                loader.remove();
            }
        }
    }
    
    setupImageLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                        }
                        
                        observer.unobserve(img);
                    }
                });
            });
            
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
    
    setupCopyToClipboard() {
        document.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('[data-copy]');
            if (!copyBtn) return;
            
            const textToCopy = copyBtn.dataset.copy;
            this.copyToClipboard(textToCopy).then(() => {
                this.showToast('Copied to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Failed to copy', 'error');
            });
        });
    }
    
    async copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
    }
    
    handleSearch(e) {
        const searchTerm = e.target.value.toLowerCase();
        const containerId = e.target.dataset.target;
        
        if (!containerId) return;
        
        const container = document.getElementById(containerId);
        if (!container) return;
        
        const items = container.querySelectorAll('.searchable-item');
        
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const isVisible = text.includes(searchTerm);
            item.style.display = isVisible ? '' : 'none';
        });
    }
    
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;
        
        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner"></span> Loading...';
        }
        
        try {
            // Validate form
            if (!this.validateForm(form)) {
                throw new Error('Please fill all required fields correctly');
            }
            
            // Get form data
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // In a real app, send to server
            console.log('Form data:', data);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Show success message
            this.showToast('Form submitted successfully!', 'success');
            
            // Reset form
            form.reset();
            
            // Close modal if form is in modal
            const modal = form.closest('.modal');
            if (modal) {
                this.closeModal(modal.id);
            }
            
        } catch (error) {
            this.showToast(error.message, 'error');
            console.error('Form submission error:', error);
            
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    }
    
    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.markFieldInvalid(field, 'This field is required');
                isValid = false;
            } else {
                this.markFieldValid(field);
                
                // Additional validation
                if (field.type === 'email') {
                    if (!this.isValidEmail(field.value)) {
                        this.markFieldInvalid(field, 'Please enter a valid email');
                        isValid = false;
                    }
                }
                
                if (field.type === 'password' && field.dataset.minLength) {
                    if (field.value.length < parseInt(field.dataset.minLength)) {
                        this.markFieldInvalid(field, `Password must be at least ${field.dataset.minLength} characters`);
                        isValid = false;
                    }
                }
            }
        });
        
        return isValid;
    }
    
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    markFieldInvalid(field, message) {
        field.classList.add('invalid');
        
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('error-message')) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentNode.insertBefore(errorElement, field.nextSibling);
        }
        
        errorElement.textContent = message;
    }
    
    markFieldValid(field) {
        field.classList.remove('invalid');
        field.classList.add('valid');
        
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('error-message')) {
            errorElement.remove();
        }
    }
    
    showConfirmDialog(button) {
        const message = button.dataset.confirmMessage || 'Are you sure?';
        const confirmText = button.dataset.confirmText || 'Yes';
        const cancelText = button.dataset.cancelText || 'No';
        const action = button.dataset.confirmAction;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Confirm Action</h3>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary cancel-btn">${cancelText}</button>
                    <button type="button" class="btn-primary confirm-btn">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Handle confirm
        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            if (action) {
                // Execute the action
                switch (action) {
                    case 'delete':
                        // Handle delete logic
                        break;
                    case 'logout':
                        // Handle logout logic
                        break;
                    default:
                        console.log('Action:', action);
                }
            }
            
            // Trigger original button click
            button.click();
            
            modal.remove();
        });
        
        // Handle cancel
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    showNotifications() {
        // Create notifications panel
        const panel = document.createElement('div');
        panel.className = 'notifications-panel';
        
        // Fetch notifications (mock)
        const notifications = this.getMockNotifications();
        
        panel.innerHTML = `
            <div class="notifications-header">
                <h3>Notifications</h3>
                <button class="mark-all-read">Mark all as read</button>
            </div>
            <div class="notifications-list">
                ${notifications.map(notif => `
                    <div class="notification-item ${notif.unread ? 'unread' : ''}">
                        <div class="notification-icon">${notif.icon}</div>
                        <div class="notification-content">
                            <div class="notification-text">${notif.text}</div>
                            <div class="notification-time">${this.formatTimeAgo(notif.time)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="notifications-footer">
                <a href="#" class="view-all">View all notifications</a>
            </div>
        `;
        
        // Position panel
        const bell = document.querySelector('.btn-notification');
        const rect = bell.getBoundingClientRect();
        
        panel.style.top = (rect.bottom + 8) + 'px';
        panel.style.right = (window.innerWidth - rect.right) + 'px';
        
        document.body.appendChild(panel);
        
        // Close panel when clicking outside
        const closePanel = (e) => {
            if (!panel.contains(e.target) && !bell.contains(e.target)) {
                panel.remove();
                document.removeEventListener('click', closePanel);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closePanel);
        }, 0);
    }
    
    getMockNotifications() {
        return [
            {
                icon: '👤',
                text: 'John Doe sent you a friend request',
                time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                unread: true
            },
            {
                icon: '💬',
                text: 'You have 3 new messages',
                time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                unread: true
            },
            {
                icon: '❤️',
                text: 'Jane Smith liked your post',
                time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                unread: false
            },
            {
                icon: '👥',
                text: 'You were added to "Myanmar Tech" group',
                time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                unread: false
            }
        ];
    }
    
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
    
    showLoading(container) {
        const loader = document.createElement('div');
        loader.className = 'loading-overlay';
        loader.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
        
        container.appendChild(loader);
        return loader;
    }
    
    hideLoading(loader) {
        if (loader) {
            loader.remove();
        }
    }
    
    generateMockContent() {
        // This would generate mock content for infinite scroll
        // In a real app, this would come from an API
        return `
            <div class="post-card">
                <div class="post-header">
                    <div class="post-user">
                        <img src="https://picsum.photos/100/100?random=${Math.random()}" 
                             class="post-user-avatar" 
                             alt="User">
                        <div class="post-user-info">
                            <div class="post-user-name">New User</div>
                            <div class="post-time">Just now</div>
                        </div>
                    </div>
                </div>
                <div class="post-content">
                    <div class="post-text">
                        This is additional content loaded via infinite scroll.
                    </div>
                </div>
            </div>
        `;
    }
    
    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    getRandomColor() {
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// Initialize UI manager
const uiManager = new UIManager();

// Make available globally
window.ui = uiManager;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}