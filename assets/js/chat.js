// chat.js - Complete Chat Functionality

class ChatManager {
    constructor() {
        this.currentUser = null;
        this.currentChat = null;
        this.chats = [];
        this.messages = [];
        this.users = [];
        this.typingUsers = new Set();
        
        this.init();
    }
    
    init() {
        this.loadCurrentUser();
        this.bindEvents();
        this.loadChats();
        this.loadUsers();
        this.setupMessageInput();
        this.setupSocketListeners();
    }
    
    loadCurrentUser() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
        } else {
            window.location.href = 'login.html';
        }
    }
    
    async loadChats() {
        try {
            const response = await fetch('data/chats.json');
            const chatsData = await response.json();
            
            // Convert object to array and add chat info
            this.chats = Object.entries(chatsData).map(([chatId, messages]) => {
                const lastMessage = messages[messages.length - 1];
                const otherUserId = chatId.split('_').find(id => id !== this.currentUser.id);
                const otherUser = this.users.find(u => u.id === otherUserId) || {
                    id: otherUserId,
                    name: 'Unknown User',
                    avatar: 'assets/img/default-avatar.png'
                };
                
                return {
                    id: chatId,
                    user: otherUser,
                    lastMessage: lastMessage?.content || 'No messages yet',
                    lastTime: lastMessage?.timestamp || new Date().toISOString(),
                    unread: Math.floor(Math.random() * 5) // Mock unread count
                };
            });
            
            this.renderChats();
        } catch (error) {
            console.error('Error loading chats:', error);
            this.chats = [];
        }
    }
    
    async loadUsers() {
        try {
            const response = await fetch('data/users.json');
            this.users = await response.json();
            this.renderUserList();
        } catch (error) {
            console.error('Error loading users:', error);
            this.users = [];
        }
    }
    
    bindEvents() {
        // Chat item clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.chat-item')) {
                const chatItem = e.target.closest('.chat-item');
                const chatId = chatItem.dataset.chatId;
                this.openChat(chatId);
            }
            
            if (e.target.closest('.new-chat-btn')) {
                this.showNewChatModal();
            }
            
            if (e.target.closest('.chat-info-btn')) {
                this.toggleChatInfo();
            }
            
            if (e.target.closest('.send-btn')) {
                this.sendMessage();
            }
        });
        
        // Search chats
        const searchInput = document.getElementById('chatSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchChats(e.target.value);
            });
        }
        
        // Message input enter key
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
            
            // Typing indicator
            messageInput.addEventListener('input', () => {
                this.sendTypingIndicator();
            });
        }
        
        // Media upload buttons
        document.querySelectorAll('.attachment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type || e.target.closest('.attachment-btn').dataset.type;
                this.handleAttachment(type);
            });
        });
        
        // Close chat info
        document.addEventListener('click', (e) => {
            if (e.target.closest('.info-panel-close')) {
                this.toggleChatInfo();
            }
        });
    }
    
    setupMessageInput() {
        const textarea = document.getElementById('messageInput');
        if (!textarea) return;
        
        // Auto-resize textarea
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        
        // Paste image
        textarea.addEventListener('paste', (e) => {
            const items = e.clipboardData.items;
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    this.handleImageUpload(file);
                    break;
                }
            }
        });
    }
    
    setupSocketListeners() {
        // In a real app, this would connect to WebSocket or Firebase
        console.log('Socket listeners setup complete');
        
        // Mock new message every 30 seconds
        setInterval(() => {
            if (this.currentChat && Math.random() > 0.7) {
                this.receiveMockMessage();
            }
        }, 30000);
    }
    
    renderChats() {
        const container = document.getElementById('chatListItems');
        if (!container) return;
        
        container.innerHTML = this.chats.map(chat => `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="chat-avatar">
                    <img src="${chat.user.avatar || 'assets/img/default-avatar.png'}" 
                         alt="${chat.user.name}">
                    <span class="online-status ${Math.random() > 0.5 ? '' : 'offline'}"></span>
                </div>
                <div class="chat-info">
                    <div class="chat-name">
                        <span>${chat.user.name}</span>
                        <span class="last-time">${this.formatTime(chat.lastTime)}</span>
                    </div>
                    <div class="last-message">${chat.lastMessage}</div>
                </div>
                ${chat.unread > 0 ? `<span class="unread-count">${chat.unread}</span>` : ''}
            </div>
        `).join('');
    }
    
    renderUserList() {
        const container = document.getElementById('usersList');
        if (!container) return;
        
        // Filter out current user and already chatted users
        const availableUsers = this.users.filter(user => 
            user.id !== this.currentUser.id &&
            !this.chats.some(chat => chat.user.id === user.id)
        );
        
        container.innerHTML = availableUsers.map(user => `
            <div class="user-select-item" data-user-id="${user.id}">
                <div class="chat-avatar">
                    <img src="${user.avatar || 'assets/img/default-avatar.png'}" 
                         alt="${user.name}">
                    <span class="online-status"></span>
                </div>
                <div class="chat-info">
                    <div class="chat-name">${user.name}</div>
                    <div class="last-message">Click to start chat</div>
                </div>
                <span class="user-select-check">✓</span>
            </div>
        `).join('');
        
        // Add click handlers
        container.querySelectorAll('.user-select-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.dataset.userId;
                item.classList.toggle('selected');
                item.querySelector('.user-select-check').style.display = 
                    item.classList.contains('selected') ? 'inline' : 'none';
            });
        });
    }
    
    async openChat(chatId) {
        this.currentChat = chatId;
        
        try {
            // Load messages for this chat
            const response = await fetch('data/chats.json');
            const chatsData = await response.json();
            this.messages = chatsData[chatId] || [];
            
            // Update UI
            this.renderMessages();
            this.updateChatHeader();
            this.markAsRead(chatId);
            
            // Show chat area
            document.querySelector('.chat-area').classList.remove('empty');
            
            // Scroll to bottom
            this.scrollToBottom();
            
        } catch (error) {
            console.error('Error opening chat:', error);
        }
    }
    
    renderMessages() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        
        // Group messages by date
        const groupedMessages = this.groupMessagesByDate(this.messages);
        
        container.innerHTML = Object.entries(groupedMessages).map(([date, messages]) => `
            <div class="message-date">
                <span class="date-label">${this.formatDate(date)}</span>
            </div>
            ${messages.map(msg => `
                <div class="message-group">
                    <div class="message-bubble ${msg.senderId === this.currentUser.id ? 'sent' : 'received'}">
                        <div class="message-content">${msg.content}</div>
                        <div class="message-time">${this.formatMessageTime(msg.timestamp)}</div>
                        ${msg.senderId === this.currentUser.id ? 
                            `<div class="message-status">${this.getMessageStatus(msg)}</div>` : ''
                        }
                    </div>
                    ${msg.media ? this.renderMediaMessage(msg.media) : ''}
                </div>
            `).join('')}
        `).join('');
        
        // Add typing indicator if active
        if (this.typingUsers.size > 0) {
            container.innerHTML += `
                <div class="typing-indicator">
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <span>Typing...</span>
                </div>
            `;
        }
    }
    
    renderMediaMessage(media) {
        if (media.type === 'image') {
            return `
                <div class="media-message">
                    <img src="${media.url}" alt="Shared image">
                </div>
            `;
        } else if (media.type === 'file') {
            return `
                <div class="file-message">
                    <div class="file-icon">📎</div>
                    <div class="file-info">
                        <div class="file-name">${media.name}</div>
                        <div class="file-size">${this.formatFileSize(media.size)}</div>
                    </div>
                    <button class="download-btn">Download</button>
                </div>
            `;
        }
        return '';
    }
    
    groupMessagesByDate(messages) {
        const groups = {};
        
        messages.forEach(msg => {
            const date = new Date(msg.timestamp).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(msg);
        });
        
        return groups;
    }
    
    updateChatHeader() {
        if (!this.currentChat) return;
        
        const chat = this.chats.find(c => c.id === this.currentChat);
        if (!chat) return;
        
        const header = document.querySelector('.chat-header');
        if (!header) return;
        
        header.querySelector('.chat-user-details h3').textContent = chat.user.name;
        header.querySelector('.status').textContent = 'Online';
    }
    
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const content = input.value.trim();
        
        if (!content || !this.currentChat) return;
        
        // Create message object
        const message = {
            id: 'msg_' + Date.now(),
            senderId: this.currentUser.id,
            content: content,
            timestamp: new Date().toISOString(),
            status: 'sent'
        };
        
        // Add to messages
        this.messages.push(message);
        
        // Update UI
        this.renderMessages();
        this.scrollToBottom();
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Update chat list
        this.updateChatLastMessage(message);
        
        // Send to server (mock)
        setTimeout(() => {
            this.updateMessageStatus(message.id, 'delivered');
        }, 1000);
        
        setTimeout(() => {
            this.updateMessageStatus(message.id, 'read');
        }, 2000);
        
        // In real app, send via WebSocket/Firebase
        // await this.sendToServer(message);
    }
    
    updateChatLastMessage(message) {
        const chat = this.chats.find(c => c.id === this.currentChat);
        if (chat) {
            chat.lastMessage = message.content;
            chat.lastTime = message.timestamp;
            this.renderChats();
        }
    }
    
    updateMessageStatus(messageId, status) {
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.status = status;
            
            // Update UI if this message is visible
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.querySelector('.message-status').textContent = 
                    status === 'sent' ? '✓' : status === 'delivered' ? '✓✓' : '✓✓✓';
            }
        }
    }
    
    sendTypingIndicator() {
        // In real app, send typing event to server
        console.log('User is typing...');
        
        // Mock: show typing indicator for 3 seconds
        this.showTypingIndicator();
        setTimeout(() => {
            this.hideTypingIndicator();
        }, 3000);
    }
    
    showTypingIndicator() {
        this.typingUsers.add('other_user');
        this.renderMessages();
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.typingUsers.delete('other_user');
        this.renderMessages();
    }
    
    receiveMockMessage() {
        if (!this.currentChat) return;
        
        const mockMessages = [
            "Hello! How are you?",
            "Did you see the new update?",
            "Let's meet tomorrow!",
            "Check out this photo!",
            "What do you think about this?"
        ];
        
        const message = {
            id: 'msg_' + Date.now(),
            senderId: 'other_user',
            content: mockMessages[Math.floor(Math.random() * mockMessages.length)],
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.renderMessages();
        this.scrollToBottom();
        this.playMessageSound();
    }
    
    playMessageSound() {
        // Simple notification sound
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
            audio.volume = 0.3;
            audio.play();
        } catch (e) {
            console.log('Could not play sound');
        }
    }
    
    handleAttachment(type) {
        switch (type) {
            case 'image':
                this.openImagePicker();
                break;
            case 'camera':
                this.openCamera();
                break;
            case 'file':
                this.openFilePicker();
                break;
            case 'location':
                this.shareLocation();
                break;
        }
    }
    
    openImagePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => this.handleImageUpload(file));
        };
        
        input.click();
    }
    
    async handleImageUpload(file) {
        // In real app, upload to Firebase Storage
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                // Create message with image
                const message = {
                    id: 'msg_' + Date.now(),
                    senderId: this.currentUser.id,
                    content: 'Shared an image',
                    timestamp: new Date().toISOString(),
                    media: {
                        type: 'image',
                        url: e.target.result,
                        name: file.name,
                        size: file.size
                    }
                };
                
                this.messages.push(message);
                this.renderMessages();
                this.scrollToBottom();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            this.showError('Failed to upload image');
        }
    }
    
    openFilePicker() {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => this.handleFileUpload(file));
        };
        
        input.click();
    }
    
    handleFileUpload(file) {
        const message = {
            id: 'msg_' + Date.now(),
            senderId: this.currentUser.id,
            content: 'Shared a file',
            timestamp: new Date().toISOString(),
            media: {
                type: 'file',
                name: file.name,
                size: file.size,
                url: URL.createObjectURL(file)
            }
        };
        
        this.messages.push(message);
        this.renderMessages();
        this.scrollToBottom();
    }
    
    shareLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation not supported');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const message = {
                    id: 'msg_' + Date.now(),
                    senderId: this.currentUser.id,
                    content: 'Shared location',
                    timestamp: new Date().toISOString(),
                    location: { latitude, longitude }
                };
                
                this.messages.push(message);
                this.renderMessages();
                this.scrollToBottom();
            },
            (error) => {
                console.error('Geolocation error:', error);
                this.showError('Could not get location');
            }
        );
    }
    
    showNewChatModal() {
        const modal = document.createElement('div');
        modal.className = 'modal new-chat-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>New Chat</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="users-list" id="usersList">
                        <!-- Users will be loaded here -->
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-secondary close-modal">Cancel</button>
                    <button type="button" class="btn-primary" id="startChatBtn">Start Chat</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Load users
        this.renderUserList();
        
        // Start chat button
        modal.querySelector('#startChatBtn').addEventListener('click', () => {
            const selected = modal.querySelector('.user-select-item.selected');
            if (selected) {
                const userId = selected.dataset.userId;
                this.createNewChat(userId);
                modal.remove();
            } else {
                alert('Please select a user');
            }
        });
        
        // Close modal
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }
    
    createNewChat(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;
        
        const chatId = [this.currentUser.id, userId].sort().join('_');
        
        // Check if chat already exists
        if (this.chats.some(c => c.id === chatId)) {
            this.openChat(chatId);
            return;
        }
        
        // Create new chat
        const newChat = {
            id: chatId,
            user: user,
            lastMessage: 'Say hello!',
            lastTime: new Date().toISOString(),
            unread: 0
        };
        
        this.chats.unshift(newChat);
        this.renderChats();
        this.openChat(chatId);
    }
    
    searchChats(query) {
        const filtered = this.chats.filter(chat => 
            chat.user.name.toLowerCase().includes(query.toLowerCase()) ||
            chat.lastMessage.toLowerCase().includes(query.toLowerCase())
        );
        
        const container = document.getElementById('chatListItems');
        if (!container) return;
        
        container.innerHTML = filtered.map(chat => `
            <div class="chat-item" data-chat-id="${chat.id}">
                <div class="chat-avatar">
                    <img src="${chat.user.avatar || 'assets/img/default-avatar.png'}" 
                         alt="${chat.user.name}">
                    <span class="online-status"></span>
                </div>
                <div class="chat-info">
                    <div class="chat-name">
                        <span>${chat.user.name}</span>
                        <span class="last-time">${this.formatTime(chat.lastTime)}</span>
                    </div>
                    <div class="last-message">${chat.lastMessage}</div>
                </div>
            </div>
        `).join('');
    }
    
    toggleChatInfo() {
        document.querySelector('.chat-info-panel').classList.toggle('active');
    }
    
    markAsRead(chatId) {
        const chat = this.chats.find(c => c.id === chatId);
        if (chat && chat.unread > 0) {
            chat.unread = 0;
            this.renderChats();
        }
    }
    
    scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    getMessageStatus(message) {
        switch (message.status) {
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓✓';
            default: return '✓';
        }
    }
    
    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diff < 7 * 24 * 60 * 60 * 1000) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString([], { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }
    
    formatMessageTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

// Initialize chat manager
let chatManager;

document.addEventListener('DOMContentLoaded', () => {
    chatManager = new ChatManager();
});