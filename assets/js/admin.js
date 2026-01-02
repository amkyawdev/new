// admin.js - Admin Dashboard

class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.stats = {};
        this.users = [];
        this.posts = [];
        this.reports = [];
        
        this.init();
    }
    
    init() {
        this.checkAdminAccess();
        this.loadData();
        this.bindEvents();
        this.setupCharts();
        this.updateStats();
    }
    
    checkAdminAccess() {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            window.location.href = 'login.html';
            return;
        }
        
        this.currentUser = JSON.parse(userData);
        
        // In a real app, check if user has admin role from Firebase
        // For demo, allow access to anyone on admin page
        if (this.currentUser.email !== 'admin@burmeweb.com') {
            console.log('Demo mode: Limited admin access');
        }
    }
    
    async loadData() {
        try {
            // Load users
            const usersResponse = await fetch('data/users.json');
            this.users = await usersResponse.json();
            this.renderUsers();
            
            // Load posts
            const postsResponse = await fetch('data/posts.json');
            this.posts = await postsResponse.json();
            this.renderPosts();
            
            // Load reports (mock data)
            this.reports = this.generateMockReports();
            this.renderReports();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load admin data');
        }
    }
    
    bindEvents() {
        // Refresh buttons
        document.querySelectorAll('.refresh-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.loadData();
                this.showSuccess('Data refreshed');
            });
        });
        
        // Export buttons
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.exportData(btn.dataset.type);
            });
        });
        
        // Search functionality
        document.querySelectorAll('.table-search input').forEach(input => {
            input.addEventListener('input', (e) => {
                const tableType = e.target.closest('.data-section').dataset.type;
                this.searchTable(tableType, e.target.value);
            });
        });
        
        // User actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-user')) {
                const userId = e.target.dataset.userId;
                this.editUser(userId);
            }
            
            if (e.target.classList.contains('delete-user')) {
                const userId = e.target.dataset.userId;
                this.deleteUser(userId);
            }
            
            if (e.target.classList.contains('ban-user')) {
                const userId = e.target.dataset.userId;
                this.banUser(userId);
            }
            
            if (e.target.classList.contains('view-post')) {
                const postId = e.target.dataset.postId;
                this.viewPost(postId);
            }
            
            if (e.target.classList.contains('delete-post')) {
                const postId = e.target.dataset.postId;
                this.deletePost(postId);
            }
        });
        
        // Toggle sidebar on mobile
        const menuToggle = document.querySelector('.menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.admin-sidebar').classList.toggle('active');
            });
        }
    }
    
    updateStats() {
        this.stats = {
            totalUsers: this.users.length,
            totalPosts: this.posts.length,
            activeUsers: this.users.filter(u => u.status === 'active').length,
            newUsers: this.users.filter(u => {
                const joinDate = new Date(u.joined);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return joinDate > weekAgo;
            }).length,
            reportedPosts: this.reports.length,
            groups: 15, // Mock data
            comments: this.posts.reduce((sum, post) => sum + (post.comments || 0), 0),
            likes: this.posts.reduce((sum, post) => sum + (post.likes || 0), 0)
        };
        
        this.renderStats();
    }
    
    renderStats() {
        const stats = [
            { id: 'totalUsers', label: 'Total Users', change: '+12%', positive: true },
            { id: 'activeUsers', label: 'Active Users', change: '+5%', positive: true },
            { id: 'totalPosts', label: 'Total Posts', change: '+23%', positive: true },
            { id: 'reportedPosts', label: 'Reports', change: '-3%', positive: false }
        ];
        
        stats.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (element) {
                element.textContent = this.stats[stat.id] || 0;
                
                const changeElement = element.parentElement.querySelector('.stat-change');
                if (changeElement) {
                    changeElement.textContent = stat.change;
                    changeElement.className = `stat-change ${stat.positive ? 'positive' : 'negative'}`;
                }
            }
        });
    }
    
    renderUsers() {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = this.users.map(user => `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || 'assets/img/default-avatar.png'}" 
                             alt="${user.name}" 
                             class="user-avatar">
                        <div>
                            <div class="user-name">${user.name}</div>
                            <div class="user-email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${this.formatDate(user.joined)}</td>
                <td>
                    <span class="status-badge status-${user.status || 'active'}">
                        ${user.status || 'Active'}
                    </span>
                </td>
                <td>${user.posts || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-user" data-user-id="${user.id}" title="Edit">
                            ✏️
                        </button>
                        <button class="btn-icon ban-user" data-user-id="${user.id}" title="Ban">
                            ⛔
                        </button>
                        <button class="btn-icon delete-user" data-user-id="${user.id}" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    renderPosts() {
        const tbody = document.querySelector('#postsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = this.posts.slice(0, 10).map(post => `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${post.authorAvatar || 'assets/img/default-avatar.png'}" 
                             alt="${post.author}" 
                             class="user-avatar">
                        <div>
                            <div class="user-name">${post.author}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="max-width: 300px;">
                        <div style="font-weight: 500; margin-bottom: 4px;">${post.content.substring(0, 100)}...</div>
                        ${post.image ? '<small style="color: #666;">📷 Has Image</small>' : ''}
                    </div>
                </td>
                <td>${post.likes || 0}</td>
                <td>${post.comments || 0}</td>
                <td>${this.formatDate(post.timestamp)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon view-post" data-post-id="${post.id}" title="View">
                            👁️
                        </button>
                        <button class="btn-icon delete-post" data-post-id="${post.id}" title="Delete">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    renderReports() {
        const tbody = document.querySelector('#reportsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = this.reports.map(report => `
            <tr>
                <td>
                    <div class="user-info">
                        <img src="${report.reporterAvatar || 'assets/img/default-avatar.png'}" 
                             alt="${report.reporter}" 
                             class="user-avatar">
                        <div>
                            <div class="user-name">${report.reporter}</div>
                        </div>
                    </div>
                </td>
                <td>${report.type}</td>
                <td>
                    <div style="max-width: 200px;">
                        ${report.reason}
                    </div>
                </td>
                <td>
                    <span class="status-badge ${report.status === 'pending' ? 'status-pending' : 'status-active'}">
                        ${report.status}
                    </span>
                </td>
                <td>${this.formatDate(report.date)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" title="Review" onclick="adminDashboard.reviewReport('${report.id}')">
                            📋
                        </button>
                        <button class="btn-icon" title="Resolve" onclick="adminDashboard.resolveReport('${report.id}')">
                            ✅
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    generateMockReports() {
        const reportTypes = ['Spam', 'Harassment', 'Inappropriate Content', 'False Information', 'Impersonation'];
        const statuses = ['pending', 'reviewed', 'resolved'];
        
        return Array.from({ length: 8 }, (_, i) => ({
            id: `report_${i + 1}`,
            reporter: `User ${i + 1}`,
            reporterAvatar: `https://picsum.photos/100/100?random=${i + 1}`,
            type: reportTypes[Math.floor(Math.random() * reportTypes.length)],
            reason: 'This content violates our community guidelines',
            status: statuses[Math.floor(Math.random() * statuses.length)],
            date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }));
    }
    
    searchTable(tableType, query) {
        let filteredData = [];
        
        switch (tableType) {
            case 'users':
                filteredData = this.users.filter(user => 
                    user.name.toLowerCase().includes(query.toLowerCase()) ||
                    user.email.toLowerCase().includes(query.toLowerCase())
                );
                this.renderFilteredUsers(filteredData);
                break;
                
            case 'posts':
                filteredData = this.posts.filter(post => 
                    post.content.toLowerCase().includes(query.toLowerCase()) ||
                    post.author.toLowerCase().includes(query.toLowerCase())
                );
                this.renderFilteredPosts(filteredData);
                break;
                
            case 'reports':
                filteredData = this.reports.filter(report => 
                    report.reporter.toLowerCase().includes(query.toLowerCase()) ||
                    report.type.toLowerCase().includes(query.toLowerCase()) ||
                    report.reason.toLowerCase().includes(query.toLowerCase())
                );
                this.renderFilteredReports(filteredData);
                break;
        }
    }
    
    renderFilteredUsers(users) {
        const tbody = document.querySelector('#usersTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge status-${user.status || 'active'}">
                        ${user.status || 'Active'}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-user" data-user-id="${user.id}">✏️</button>
                        <button class="btn-icon delete-user" data-user-id="${user.id}">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    renderFilteredPosts(posts) {
        const tbody = document.querySelector('#postsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = posts.slice(0, 10).map(post => `
            <tr>
                <td>${post.author}</td>
                <td>${post.content.substring(0, 50)}...</td>
                <td>${post.likes || 0}</td>
                <td>${post.comments || 0}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon view-post" data-post-id="${post.id}">👁️</button>
                        <button class="btn-icon delete-post" data-post-id="${post.id}">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    renderFilteredReports(reports) {
        const tbody = document.querySelector('#reportsTable tbody');
        if (!tbody) return;
        
        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>${report.reporter}</td>
                <td>${report.type}</td>
                <td>${report.reason.substring(0, 50)}...</td>
                <td>
                    <span class="status-badge ${report.status === 'pending' ? 'status-pending' : 'status-active'}">
                        ${report.status}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="adminDashboard.reviewReport('${report.id}')">📋</button>
                        <button class="btn-icon" onclick="adminDashboard.resolveReport('${report.id}')">✅</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const modal = this.createEditModal('Edit User', `
            <div class="form-row">
                <div class="form-group">
                    <label>Name</label>
                    <input type="text" class="form-control" value="${user.name}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" class="form-control" value="${user.email}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Status</label>
                    <select class="form-control">
                        <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="banned" ${user.status === 'banned' ? 'selected' : ''}>Banned</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Role</label>
                    <select class="form-control">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </div>
            </div>
        `);
        
        modal.querySelector('.btn-primary').addEventListener('click', () => {
            // Update user data
            const name = modal.querySelector('input[type="text"]').value;
            const email = modal.querySelector('input[type="email"]').value;
            const status = modal.querySelector('select').value;
            
            // Update in array
            const index = this.users.findIndex(u => u.id === userId);
            if (index > -1) {
                this.users[index] = { ...this.users[index], name, email, status };
                this.renderUsers();
                this.showSuccess('User updated successfully');
            }
            
            modal.remove();
        });
    }
    
    deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user?')) return;
        
        // Remove from array
        this.users = this.users.filter(u => u.id !== userId);
        this.renderUsers();
        this.updateStats();
        this.showSuccess('User deleted successfully');
    }
    
    banUser(userId) {
        if (!confirm('Are you sure you want to ban this user?')) return;
        
        // Update user status
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.status = 'banned';
            this.renderUsers();
            this.showSuccess('User banned successfully');
        }
    }
    
    viewPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;
        
        const modal = this.createEditModal('View Post', `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                    <img src="${post.authorAvatar || 'assets/img/default-avatar.png'}" 
                         alt="${post.author}" 
                         style="width: 40px; height: 40px; border-radius: 50%;">
                    <div>
                        <div style="font-weight: 500;">${post.author}</div>
                        <div style="font-size: 12px; color: #666;">${this.formatDate(post.timestamp)}</div>
                    </div>
                </div>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                    ${post.content}
                </div>
                ${post.image ? 
                    `<img src="${post.image}" alt="Post image" style="max-width: 100%; border-radius: 8px; margin-bottom: 15px;">` : 
                    ''
                }
                <div style="display: flex; gap: 20px; color: #666;">
                    <span>❤️ ${post.likes || 0} Likes</span>
                    <span>💬 ${post.comments || 0} Comments</span>
                </div>
            </div>
        `);
    }
    
    deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post?')) return;
        
        // Remove from array
        this.posts = this.posts.filter(p => p.id !== postId);
        this.renderPosts();
        this.updateStats();
        this.showSuccess('Post deleted successfully');
    }
    
    reviewReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;
        
        report.status = 'reviewed';
        this.renderReports();
        this.showSuccess('Report marked as reviewed');
    }
    
    resolveReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;
        
        report.status = 'resolved';
        this.renderReports();
        this.showSuccess('Report resolved');
    }
    
    exportData(type) {
        let data, filename;
        
        switch (type) {
            case 'users':
                data = JSON.stringify(this.users, null, 2);
                filename = 'burmeweb_users.json';
                break;
            case 'posts':
                data = JSON.stringify(this.posts.slice(0, 50), null, 2);
                filename = 'burmeweb_posts.json';
                break;
            case 'stats':
                data = JSON.stringify(this.stats, null, 2);
                filename = 'burmeweb_stats.json';
                break;
        }
        
        if (!data) return;
        
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess(`Exported ${type} data`);
    }
    
    setupCharts() {
        // User growth chart
        this.setupUserGrowthChart();
        
        // Activity chart
        this.setupActivityChart();
    }
    
    setupUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) return;
        
        // Mock data for chart
        const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const data = {
            labels: labels,
            datasets: [{
                label: 'New Users',
                data: [65, 78, 90, 120, 150, 200],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4
            }]
        };
        
        // In a real app, use Chart.js
        console.log('User Growth Chart initialized with data:', data);
    }
    
    setupActivityChart() {
        const ctx = document.getElementById('activityChart');
        if (!ctx) return;
        
        // Mock data for chart
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = {
            labels: labels,
            datasets: [{
                label: 'Posts',
                data: [120, 150, 180, 130, 170, 90, 110],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true
            }, {
                label: 'Comments',
                data: [200, 230, 250, 210, 240, 180, 190],
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true
            }]
        };
        
        console.log('Activity Chart initialized with data:', data);
    }
    
    createEditModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal admin-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="button" class="btn-primary">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
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
        
        return modal;
    }
    
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
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

// Initialize admin dashboard
let adminDashboard;

document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});