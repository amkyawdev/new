// group.js - Group Management

class GroupManager {
    constructor() {
        this.currentUser = null;
        this.groups = [];
        this.userGroups = [];
        
        this.init();
    }
    
    init() {
        this.loadCurrentUser();
        this.bindEvents();
        this.loadGroups();
        this.loadUserGroups();
    }
    
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        }
    }
    
    bindEvents() {
        // Create group modal
        document.getElementById('createGroupBtn')?.addEventListener('click', () => {
            this.showCreateGroupModal();
        });
        
        // Join group buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('join-btn')) {
                const groupId = e.target.dataset.groupId;
                this.joinGroup(groupId);
            }
            
            if (e.target.classList.contains('leave-btn')) {
                const groupId = e.target.dataset.groupId;
                this.leaveGroup(groupId);
            }
            
            if (e.target.classList.contains('view-group-btn')) {
                const groupId = e.target.dataset.groupId;
                this.viewGroupDetails(groupId);
            }
        });
        
        // Search groups
        const searchInput = document.getElementById('groupSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchGroups(e.target.value);
            });
        }
        
        // Category filter
        document.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const category = item.dataset.category;
                this.filterByCategory(category);
            });
        });
    }
    
    async loadGroups() {
        try {
            // Load from localStorage or Firebase
            const savedGroups = localStorage.getItem('groups');
            if (savedGroups) {
                this.groups = JSON.parse(savedGroups);
            } else {
                // Load from mock data
                const response = await fetch('data/groups.json');
                this.groups = await response.json();
                localStorage.setItem('groups', JSON.stringify(this.groups));
            }
            
            this.renderGroups(this.groups);
        } catch (error) {
            console.error('Error loading groups:', error);
            this.showError('Failed to load groups');
        }
    }
    
    async loadUserGroups() {
        if (!this.currentUser) return;
        
        try {
            const userGroups = localStorage.getItem(`userGroups_${this.currentUser.id}`);
            if (userGroups) {
                this.userGroups = JSON.parse(userGroups);
                this.renderUserGroups();
            }
        } catch (error) {
            console.error('Error loading user groups:', error);
        }
    }
    
    renderGroups(groups) {
        const container = document.getElementById('groupsContainer');
        if (!container) return;
        
        container.innerHTML = groups.map(group => `
            <div class="group-card" data-group-id="${group.id}">
                <div class="group-cover" style="background: ${group.coverColor || '#6a11cb'}">
                    <div class="group-avatar">
                        ${group.icon || '👥'}
                    </div>
                </div>
                <div class="group-info">
                    <h3 class="group-title">${group.name}</h3>
                    <p class="group-description">${group.description}</p>
                    
                    <div class="group-stats">
                        <span class="group-members">
                            👥 ${group.members} members
                        </span>
                        <span class="group-category">
                            ${group.category}
                        </span>
                    </div>
                    
                    <div class="group-actions-bottom">
                        ${this.userGroups.includes(group.id) ? 
                            `<button class="leave-btn" data-group-id="${group.id}">Leave</button>` :
                            `<button class="join-btn" data-group-id="${group.id}">Join</button>`
                        }
                        <button class="view-btn view-group-btn" data-group-id="${group.id}">View</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    renderUserGroups() {
        const container = document.getElementById('userGroupsContainer');
        if (!container) return;
        
        const userGroups = this.groups.filter(g => this.userGroups.includes(g.id));
        container.innerHTML = userGroups.map(group => `
            <div class="group-card">
                <div class="group-cover" style="background: ${group.coverColor}">
                    <div class="group-avatar">
                        ${group.icon}
                    </div>
                </div>
                <div class="group-info">
                    <h3 class="group-title">${group.name}</h3>
                    <p class="group-description">${group.description}</p>
                    <div class="group-actions-bottom">
                        <button class="view-btn" onclick="groupManager.viewGroupDetails('${group.id}')">Open</button>
                        <button class="leave-btn" data-group-id="${group.id}">Leave</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    async joinGroup(groupId) {
        if (!this.currentUser) {
            alert('Please login to join groups');
            return;
        }
        
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        try {
            // Add user to group members
            if (!this.userGroups.includes(groupId)) {
                this.userGroups.push(groupId);
                group.members++;
                
                // Save to localStorage
                localStorage.setItem(`userGroups_${this.currentUser.id}`, JSON.stringify(this.userGroups));
                localStorage.setItem('groups', JSON.stringify(this.groups));
                
                // Update UI
                this.renderGroups(this.groups);
                this.renderUserGroups();
                
                this.showSuccess(`Joined ${group.name}`);
                
                // Firebase integration would go here
                // await firebase.database().ref(`groups/${groupId}/members`).push(this.currentUser.id);
            }
        } catch (error) {
            console.error('Error joining group:', error);
            this.showError('Failed to join group');
        }
    }
    
    async leaveGroup(groupId) {
        if (!this.currentUser) return;
        
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        try {
            const index = this.userGroups.indexOf(groupId);
            if (index > -1) {
                this.userGroups.splice(index, 1);
                group.members = Math.max(0, group.members - 1);
                
                // Save to localStorage
                localStorage.setItem(`userGroups_${this.currentUser.id}`, JSON.stringify(this.userGroups));
                localStorage.setItem('groups', JSON.stringify(this.groups));
                
                // Update UI
                this.renderGroups(this.groups);
                this.renderUserGroups();
                
                this.showSuccess(`Left ${group.name}`);
            }
        } catch (error) {
            console.error('Error leaving group:', error);
            this.showError('Failed to leave group');
        }
    }
    
    async createGroup(groupData) {
        if (!this.currentUser) {
            alert('Please login to create groups');
            return;
        }
        
        try {
            const newGroup = {
                id: 'group_' + Date.now(),
                name: groupData.name,
                description: groupData.description,
                category: groupData.category,
                privacy: groupData.privacy,
                coverColor: this.getRandomColor(),
                icon: this.getGroupIcon(groupData.category),
                members: 1,
                createdBy: this.currentUser.id,
                createdAt: new Date().toISOString(),
                rules: groupData.rules || 'Be respectful to all members'
            };
            
            this.groups.unshift(newGroup);
            this.userGroups.push(newGroup.id);
            
            // Save to localStorage
            localStorage.setItem('groups', JSON.stringify(this.groups));
            localStorage.setItem(`userGroups_${this.currentUser.id}`, JSON.stringify(this.userGroups));
            
            // Update UI
            this.renderGroups(this.groups);
            this.renderUserGroups();
            
            this.showSuccess(`Group "${newGroup.name}" created successfully!`);
            
            // Close modal
            this.hideModal('createGroupModal');
            
            // Firebase integration would go here
            // await firebase.database().ref(`groups/${newGroup.id}`).set(newGroup);
            
        } catch (error) {
            console.error('Error creating group:', error);
            this.showError('Failed to create group');
        }
    }
    
    searchGroups(query) {
        const filtered = this.groups.filter(group => 
            group.name.toLowerCase().includes(query.toLowerCase()) ||
            group.description.toLowerCase().includes(query.toLowerCase()) ||
            group.category.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderGroups(filtered);
    }
    
    filterByCategory(category) {
        if (category === 'all') {
            this.renderGroups(this.groups);
            return;
        }
        
        const filtered = this.groups.filter(group => group.category === category);
        this.renderGroups(filtered);
    }
    
    viewGroupDetails(groupId) {
        const group = this.groups.find(g => g.id === groupId);
        if (!group) return;
        
        // In a real app, this would navigate to group detail page
        // For now, show in modal
        this.showGroupDetailModal(group);
    }
    
    showCreateGroupModal() {
        const modal = document.getElementById('createGroupModal');
        if (!modal) return;
        
        const form = modal.querySelector('form');
        form.reset();
        
        modal.style.display = 'flex';
        
        // Set up form submission
        form.onsubmit = (e) => {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('groupName').value,
                description: document.getElementById('groupDescription').value,
                category: document.getElementById('groupCategory').value,
                privacy: document.getElementById('groupPrivacy').value,
                rules: document.getElementById('groupRules').value
            };
            
            this.createGroup(formData);
        };
    }
    
    showGroupDetailModal(group) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${group.name}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                        <div style="width: 100px; height: 100px; background: ${group.coverColor}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                            ${group.icon}
                        </div>
                        <div>
                            <h4 style="margin-bottom: 10px;">About</h4>
                            <p>${group.description}</p>
                            <div style="display: flex; gap: 20px; margin-top: 15px;">
                                <div>
                                    <strong>${group.members}</strong>
                                    <div style="font-size: 12px; color: #666;">Members</div>
                                </div>
                                <div>
                                    <strong>${group.privacy}</strong>
                                    <div style="font-size: 12px; color: #666;">Privacy</div>
                                </div>
                                <div>
                                    <strong>${group.category}</strong>
                                    <div style="font-size: 12px; color: #666;">Category</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h4 style="margin-bottom: 10px;">Group Rules</h4>
                    <p style="background: #f5f5f5; padding: 15px; border-radius: 8px;">${group.rules}</p>
                    
                    <div style="margin-top: 20px; display: flex; gap: 10px;">
                        ${this.userGroups.includes(group.id) ? 
                            `<button class="leave-btn" data-group-id="${group.id}" style="padding: 10px 20px;">Leave Group</button>` :
                            `<button class="join-btn" data-group-id="${group.id}" style="padding: 10px 20px;">Join Group</button>`
                        }
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        modal.style.display = 'flex';
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    getRandomColor() {
        const colors = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getGroupIcon(category) {
        const icons = {
            'technology': '💻',
            'education': '📚',
            'entertainment': '🎬',
            'sports': '⚽',
            'business': '💼',
            'gaming': '🎮',
            'music': '🎵',
            'art': '🎨',
            'health': '❤️',
            'travel': '✈️'
        };
        return icons[category] || '👥';
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

// Initialize group manager
let groupManager;

document.addEventListener('DOMContentLoaded', () => {
    groupManager = new GroupManager();
});