// profile.js - Profile Management

class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.friends = [];
        this.photos = [];
        this.activities = [];
        
        this.init();
    }
    
    init() {
        this.loadCurrentUser();
        this.bindEvents();
        this.loadProfile();
        this.loadFriends();
        this.loadPhotos();
        this.loadActivities();
        this.setupTabs();
        this.setupSettings();
    }
    
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        } else {
            // Redirect to login if no user
            window.location.href = 'login.html';
        }
    }
    
    async loadProfile() {
        try {
            // Load profile from localStorage or Firebase
            const profileId = this.currentUser?.id || 'default';
            const savedProfile = localStorage.getItem(`profile_${profileId}`);
            
            if (savedProfile) {
                this.userProfile = JSON.parse(savedProfile);
            } else {
                // Load from mock data or create default
                const response = await fetch('data/users.json');
                const users = await response.json();
                this.userProfile = users.find(u => u.id === profileId) || this.createDefaultProfile();
                localStorage.setItem(`profile_${profileId}`, JSON.stringify(this.userProfile));
            }
            
            this.renderProfile();
        } catch (error) {
            console.error('Error loading profile:', error);
            this.userProfile = this.createDefaultProfile();
            this.renderProfile();
        }
    }
    
    createDefaultProfile() {
        return {
            id: this.currentUser?.id,
            username: this.currentUser?.username,
            email: this.currentUser?.email,
            name: this.currentUser?.name || 'New User',
            bio: 'Welcome to my profile!',
            location: 'Yangon, Myanmar',
            website: '',
            birthday: '1990-01-01',
            education: 'University',
            work: 'Professional',
            skills: ['HTML', 'CSS', 'JavaScript', 'React'],
            joined: new Date().toISOString(),
            coverPhoto: '',
            avatar: 'assets/img/default-avatar.png'
        };
    }
    
    async loadFriends() {
        try {
            const response = await fetch('data/users.json');
            const users = await response.json();
            // Get random 9 friends from users
            this.friends = users
                .filter(u => u.id !== this.currentUser?.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, 9);
            
            this.renderFriends();
        } catch (error) {
            console.error('Error loading friends:', error);
            this.friends = [];
        }
    }
    
    async loadPhotos() {
        try {
            // Mock photos - in real app, these would come from Firebase Storage
            this.photos = Array.from({ length: 9 }, (_, i) => ({
                id: i + 1,
                url: `https://picsum.photos/400/400?random=${i + 1}`,
                caption: `Photo ${i + 1}`,
                uploaded: new Date(Date.now() - i * 86400000).toISOString()
            }));
            
            this.renderPhotos();
        } catch (error) {
            console.error('Error loading photos:', error);
            this.photos = [];
        }
    }
    
    async loadActivities() {
        try {
            // Mock activities
            this.activities = [
                {
                    id: 1,
                    type: 'post',
                    icon: '📝',
                    text: 'Created a new post',
                    time: '2 hours ago'
                },
                {
                    id: 2,
                    type: 'like',
                    icon: '❤️',
                    text: 'Liked a photo',
                    time: '5 hours ago'
                },
                {
                    id: 3,
                    type: 'comment',
                    icon: '💬',
                    text: 'Commented on a post',
                    time: '1 day ago'
                },
                {
                    id: 4,
                    type: 'friend',
                    icon: '👥',
                    text: 'Added a new friend',
                    time: '2 days ago'
                },
                {
                    id: 5,
                    type: 'group',
                    icon: '👥',
                    text: 'Joined a group',
                    time: '3 days ago'
                }
            ];
            
            this.renderActivities();
        } catch (error) {
            console.error('Error loading activities:', error);
            this.activities = [];
        }
    }
    
    bindEvents() {
        // Edit profile buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showEditModal(btn.dataset.section);
            });
        });
        
        // Avatar upload
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('click', () => {
                document.getElementById('avatarInput')?.click();
            });
            
            document.getElementById('avatarInput')?.addEventListener('change', (e) => {
                this.uploadAvatar(e.target.files[0]);
            });
        }
        
        // Cover upload
        const coverUpload = document.getElementById('coverUpload');
        if (coverUpload) {
            coverUpload.addEventListener('click', () => {
                document.getElementById('coverInput')?.click();
            });
            
            document.getElementById('coverInput')?.addEventListener('change', (e) => {
                this.uploadCover(e.target.files[0]);
            });
        }
        
        // Settings modal
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.showSettingsModal();
        });
    }
    
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                
                // Update active tab button
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show selected tab content
                tabContents.forEach(content => {
                    content.style.display = content.id === tabId ? 'block' : 'none';
                });
            });
        });
    }
    
    setupSettings() {
        const settingsTabs = document.querySelectorAll('.settings-tab-btn');
        const settingsContents = document.querySelectorAll('.settings-content');
        
        settingsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                settingsTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                settingsContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}Settings`) {
                        content.classList.add('active');
                    }
                });
            });
        });
        
        // Save settings
        document.getElementById('saveSettings')?.addEventListener('click', () => {
            this.saveSettings();
        });
    }
    
    renderProfile() {
        if (!this.userProfile) return;
        
        // Update profile header
        const profileAvatar = document.getElementById('profileAvatar');
        if (profileAvatar) {
            profileAvatar.src = this.userProfile.avatar || 'assets/img/default-avatar.png';
            profileAvatar.alt = this.userProfile.name;
        }
        
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = this.userProfile.name;
        }
        
        const profileBio = document.getElementById('profileBio');
        if (profileBio) {
            profileBio.textContent = this.userProfile.bio;
        }
        
        // Update about section
        this.updateAboutSection();
        
        // Update stats
        this.updateStats();
    }
    
    updateAboutSection() {
        const sections = {
            'location': this.userProfile.location,
            'website': this.userProfile.website || 'Not specified',
            'birthday': this.formatDate(this.userProfile.birthday),
            'education': this.userProfile.education || 'Not specified',
            'work': this.userProfile.work || 'Not specified'
        };
        
        Object.entries(sections).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update skills
        const skillsContainer = document.getElementById('skillsList');
        if (skillsContainer) {
            skillsContainer.innerHTML = this.userProfile.skills
                ?.map(skill => `<span class="skill-tag">${skill}</span>`)
                .join('') || '<p>No skills added yet</p>';
        }
    }
    
    updateStats() {
        const stats = {
            'postsCount': Math.floor(Math.random() * 100) + 50,
            'friendsCount': this.friends.length,
            'photosCount': this.photos.length,
            'groupsCount': Math.floor(Math.random() * 20) + 5
        };
        
        Object.entries(stats).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    renderFriends() {
        const container = document.getElementById('friendsContainer');
        if (!container) return;
        
        container.innerHTML = this.friends.map(friend => `
            <div class="friend-card">
                <img src="${friend.avatar || 'assets/img/default-avatar.png'}" 
                     alt="${friend.name}" 
                     class="friend-avatar">
                <div class="friend-name">${friend.name}</div>
            </div>
        `).join('');
    }
    
    renderPhotos() {
        const container = document.getElementById('photosContainer');
        if (!container) return;
        
        container.innerHTML = this.photos.map(photo => `
            <div class="photo-item" data-photo-id="${photo.id}">
                <img src="${photo.url}" alt="${photo.caption}">
            </div>
        `).join('');
    }
    
    renderActivities() {
        const container = document.getElementById('activitiesContainer');
        if (!container) return;
        
        container.innerHTML = this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    ${activity.icon}
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </div>
        `).join('');
    }
    
    async uploadAvatar(file) {
        if (!file) return;
        
        try {
            // In a real app, upload to Firebase Storage
            // For now, create a local URL
            const reader = new FileReader();
            reader.onload = (e) => {
                this.userProfile.avatar = e.target.result;
                
                // Update localStorage
                localStorage.setItem(`profile_${this.userProfile.id}`, JSON.stringify(this.userProfile));
                
                // Update UI
                this.renderProfile();
                
                this.showSuccess('Profile picture updated!');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            this.showError('Failed to upload avatar');
        }
    }
    
    async uploadCover(file) {
        if (!file) return;
        
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Update cover in UI
                const coverElement = document.querySelector('.profile-cover');
                if (coverElement) {
                    coverElement.style.background = `url(${e.target.result}) center/cover no-repeat`;
                }
                
                this.showSuccess('Cover photo updated!');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading cover:', error);
            this.showError('Failed to upload cover photo');
        }
    }
    
    showEditModal(section) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        const formContent = this.getEditForm(section);
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Edit ${section}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="editForm">
                    <div class="modal-body">
                        ${formContent}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary close-modal">Cancel</button>
                        <button type="submit" class="btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Handle form submission
        const form = modal.querySelector('#editForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileChanges(section, new FormData(form));
            modal.remove();
        });
        
        // Close modal handlers
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    getEditForm(section) {
        const forms = {
            'about': `
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" name="name" value="${this.userProfile.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Bio</label>
                    <textarea name="bio" rows="3">${this.userProfile.bio || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" name="location" value="${this.userProfile.location || ''}">
                </div>
                <div class="form-group">
                    <label>Website</label>
                    <input type="url" name="website" value="${this.userProfile.website || ''}">
                </div>
            `,
            'work': `
                <div class="form-group">
                    <label>Education</label>
                    <input type="text" name="education" value="${this.userProfile.education || ''}">
                </div>
                <div class="form-group">
                    <label>Work</label>
                    <input type="text" name="work" value="${this.userProfile.work || ''}">
                </div>
                <div class="form-group">
                    <label>Birthday</label>
                    <input type="date" name="birthday" value="${this.userProfile.birthday || ''}">
                </div>
            `,
            'skills': `
                <div class="form-group">
                    <label>Skills (comma separated)</label>
                    <textarea name="skills" rows="4">${this.userProfile.skills?.join(', ') || ''}</textarea>
                    <small>Example: HTML, CSS, JavaScript, React</small>
                </div>
            `
        };
        
        return forms[section] || '<p>Edit form not available for this section.</p>';
    }
    
    saveProfileChanges(section, formData) {
        const updates = {};
        
        switch (section) {
            case 'about':
                updates.name = formData.get('name');
                updates.bio = formData.get('bio');
                updates.location = formData.get('location');
                updates.website = formData.get('website');
                break;
                
            case 'work':
                updates.education = formData.get('education');
                updates.work = formData.get('work');
                updates.birthday = formData.get('birthday');
                break;
                
            case 'skills':
                const skillsText = formData.get('skills');
                updates.skills = skillsText
                    .split(',')
                    .map(skill => skill.trim())
                    .filter(skill => skill.length > 0);
                break;
        }
        
        // Update profile
        Object.assign(this.userProfile, updates);
        
        // Save to localStorage
        localStorage.setItem(`profile_${this.userProfile.id}`, JSON.stringify(this.userProfile));
        
        // Update UI
        this.renderProfile();
        
        this.showSuccess('Profile updated successfully!');
    }
    
    showSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content settings-modal">
                <div class="modal-header">
                    <h3>Account Settings</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-tabs">
                        <button class="settings-tab-btn active" data-tab="account">Account</button>
                        <button class="settings-tab-btn" data-tab="privacy">Privacy</button>
                        <button class="settings-tab-btn" data-tab="notifications">Notifications</button>
                    </div>
                    
                    <div id="accountSettings" class="settings-content active">
                        <div class="setting-item">
                            <label>
                                Email Notifications
                                <label class="toggle-switch">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                Public Profile
                                <label class="toggle-switch">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                Show Online Status
                                <label class="toggle-switch">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </label>
                        </div>
                    </div>
                    
                    <div id="privacySettings" class="settings-content">
                        <div class="setting-item">
                            <label>
                                Who can see your posts
                                <select class="form-control">
                                    <option>Everyone</option>
                                    <option>Friends Only</option>
                                    <option>Only Me</option>
                                </select>
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                Who can send you friend requests
                                <select class="form-control">
                                    <option>Everyone</option>
                                    <option>Friends of Friends</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    
                    <div id="notificationsSettings" class="settings-content">
                        <div class="setting-item">
                            <label>
                                Push Notifications
                                <label class="toggle-switch">
                                    <input type="checkbox" checked>
                                    <span class="toggle-slider"></span>
                                </label>
                            </label>
                        </div>
                        <div class="setting-item">
                            <label>
                                Email Digest
                                <label class="toggle-switch">
                                    <input type="checkbox">
                                    <span class="toggle-slider"></span>
                                </label>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="button" class="btn-primary" id="saveSettings">Save Settings</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Set up tabs
        const tabs = modal.querySelectorAll('.settings-tab-btn');
        const contents = modal.querySelectorAll('.settings-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                contents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tabId}Settings`) {
                        content.classList.add('active');
                    }
                });
            });
        });
        
        // Save settings
        modal.querySelector('#saveSettings').addEventListener('click', () => {
            this.saveSettings();
            modal.remove();
        });
        
        // Close modal
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    saveSettings() {
        // In a real app, save settings to Firebase
        console.log('Settings saved');
        this.showSuccess('Settings saved successfully!');
    }
    
    formatDate(dateString) {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize profile manager
let profileManager;

document.addEventListener('DOMContentLoaded', () => {
    profileManager = new ProfileManager();
});