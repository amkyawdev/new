// storage.js - LocalStorage and Firebase Storage Management

class StorageManager {
    constructor() {
        this.firebaseApp = null;
        this.firebaseAuth = null;
        this.firebaseDb = null;
        this.firebaseStorage = null;
        
        this.initFirebase();
    }
    
    initFirebase() {
        // Check if Firebase config exists
        if (typeof appConfig === 'undefined') {
            console.warn('Firebase configuration not found. Running in offline mode.');
            return;
        }
        
        try {
            // Initialize Firebase
            this.firebaseApp = firebase.initializeApp(appConfig.firebase);
            this.firebaseAuth = firebase.auth();
            this.firebaseDb = firebase.database();
            this.firebaseStorage = firebase.storage();
            
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Firebase initialization error:', error);
        }
    }
    
    // LocalStorage Methods
    
    setItem(key, value) {
        try {
            const stringValue = JSON.stringify(value);
            localStorage.setItem(key, stringValue);
            return true;
        } catch (error) {
            console.error('LocalStorage setItem error:', error);
            return false;
        }
    }
    
    getItem(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('LocalStorage getItem error:', error);
            return defaultValue;
        }
    }
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('LocalStorage removeItem error:', error);
            return false;
        }
    }
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('LocalStorage clear error:', error);
            return false;
        }
    }
    
    // User Data Management
    
    saveUser(userData) {
        const users = this.getItem('users', []);
        const existingIndex = users.findIndex(u => u.id === userData.id || u.email === userData.email);
        
        if (existingIndex >= 0) {
            users[existingIndex] = { ...users[existingIndex], ...userData };
        } else {
            users.push(userData);
        }
        
        return this.setItem('users', users);
    }
    
    getUser(userIdOrEmail) {
        const users = this.getItem('users', []);
        return users.find(u => u.id === userIdOrEmail || u.email === userIdOrEmail);
    }
    
    getCurrentUser() {
        return this.getItem('currentUser');
    }
    
    setCurrentUser(user) {
        return this.setItem('currentUser', user);
    }
    
    logout() {
        this.removeItem('currentUser');
        this.removeItem('authToken');
        
        // Clear Firebase auth if exists
        if (this.firebaseAuth) {
            this.firebaseAuth.signOut();
        }
        
        return true;
    }
    
    // Post Management
    
    savePost(postData) {
        const posts = this.getItem('posts', []);
        postData.id = postData.id || 'post_' + Date.now();
        postData.timestamp = postData.timestamp || new Date().toISOString();
        
        posts.unshift(postData);
        return this.setItem('posts', posts);
    }
    
    getPosts(limit = 50) {
        const posts = this.getItem('posts', []);
        return posts.slice(0, limit);
    }
    
    getPost(postId) {
        const posts = this.getItem('posts', []);
        return posts.find(p => p.id === postId);
    }
    
    updatePost(postId, updates) {
        const posts = this.getItem('posts', []);
        const index = posts.findIndex(p => p.id === postId);
        
        if (index >= 0) {
            posts[index] = { ...posts[index], ...updates };
            return this.setItem('posts', posts);
        }
        
        return false;
    }
    
    deletePost(postId) {
        const posts = this.getItem('posts', []);
        const filteredPosts = posts.filter(p => p.id !== postId);
        return this.setItem('posts', filteredPosts);
    }
    
    // Chat Management
    
    saveMessage(chatId, messageData) {
        const chats = this.getItem('chats', {});
        if (!chats[chatId]) {
            chats[chatId] = [];
        }
        
        messageData.id = messageData.id || 'msg_' + Date.now();
        messageData.timestamp = messageData.timestamp || new Date().toISOString();
        
        chats[chatId].push(messageData);
        return this.setItem('chats', chats);
    }
    
    getMessages(chatId, limit = 100) {
        const chats = this.getItem('chats', {});
        return chats[chatId] ? chats[chatId].slice(-limit) : [];
    }
    
    getChats() {
        const chats = this.getItem('chats', {});
        return Object.keys(chats).map(chatId => ({
            id: chatId,
            lastMessage: chats[chatId]?.[chats[chatId].length - 1],
            unread: 0
        }));
    }
    
    // Group Management
    
    saveGroup(groupData) {
        const groups = this.getItem('groups', []);
        groupData.id = groupData.id || 'group_' + Date.now();
        
        const existingIndex = groups.findIndex(g => g.id === groupData.id);
        
        if (existingIndex >= 0) {
            groups[existingIndex] = { ...groups[existingIndex], ...groupData };
        } else {
            groups.push(groupData);
        }
        
        return this.setItem('groups', groups);
    }
    
    getGroups() {
        return this.getItem('groups', []);
    }
    
    getUserGroups(userId) {
        const userGroups = this.getItem(`userGroups_${userId}`, []);
        return userGroups;
    }
    
    // Firebase Methods
    
    async uploadFile(file, path) {
        if (!this.firebaseStorage) {
            throw new Error('Firebase Storage not initialized');
        }
        
        try {
            const storageRef = this.firebaseStorage.ref();
            const fileRef = storageRef.child(path);
            const snapshot = await fileRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            return downloadURL;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }
    
    async saveToFirebase(path, data) {
        if (!this.firebaseDb) {
            throw new Error('Firebase Database not initialized');
        }
        
        try {
            await this.firebaseDb.ref(path).set(data);
            return true;
        } catch (error) {
            console.error('Firebase save error:', error);
            throw error;
        }
    }
    
    async getFromFirebase(path) {
        if (!this.firebaseDb) {
            throw new Error('Firebase Database not initialized');
        }
        
        try {
            const snapshot = await this.firebaseDb.ref(path).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Firebase get error:', error);
            throw error;
        }
    }
    
    async listenToFirebase(path, callback) {
        if (!this.firebaseDb) {
            throw new Error('Firebase Database not initialized');
        }
        
        try {
            const ref = this.firebaseDb.ref(path);
            ref.on('value', (snapshot) => {
                callback(snapshot.val());
            });
            return ref;
        } catch (error) {
            console.error('Firebase listen error:', error);
            throw error;
        }
    }
    
    // Backup and Restore
    
    backupData() {
        const backup = {
            users: this.getItem('users', []),
            posts: this.getItem('posts', []),
            chats: this.getItem('chats', {}),
            groups: this.getItem('groups', []),
            timestamp: new Date().toISOString()
        };
        
        return JSON.stringify(backup, null, 2);
    }
    
    restoreData(backupString) {
        try {
            const backup = JSON.parse(backupString);
            
            if (backup.users) this.setItem('users', backup.users);
            if (backup.posts) this.setItem('posts', backup.posts);
            if (backup.chats) this.setItem('chats', backup.chats);
            if (backup.groups) this.setItem('groups', backup.groups);
            
            return true;
        } catch (error) {
            console.error('Restore error:', error);
            return false;
        }
    }
    
    // Cache Management
    
    clearCache() {
        const keepKeys = ['users', 'currentUser', 'chats', 'groups'];
        const allKeys = Object.keys(localStorage);
        
        allKeys.forEach(key => {
            if (!keepKeys.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        return true;
    }
    
    // Helper Methods
    
    generateId(prefix = 'item') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    isOnline() {
        return navigator.onLine;
    }
    
    // Sync Management (for offline-first approach)
    
    async syncOfflineData() {
        if (!this.isOnline()) {
            console.log('Offline - skipping sync');
            return;
        }
        
        if (!this.firebaseAuth || !this.firebaseDb) {
            console.log('Firebase not available - skipping sync');
            return;
        }
        
        const user = this.firebaseAuth.currentUser;
        if (!user) {
            console.log('No user logged in - skipping sync');
            return;
        }
        
        try {
            // Sync posts
            await this.syncPosts(user.uid);
            
            // Sync user data
            await this.syncUserProfile(user.uid);
            
            console.log('Sync completed successfully');
        } catch (error) {
            console.error('Sync error:', error);
        }
    }
    
    async syncPosts(userId) {
        const localPosts = this.getItem('posts', []);
        const offlinePosts = localPosts.filter(p => !p.synced);
        
        for (const post of offlinePosts) {
            try {
                const postRef = this.firebaseDb.ref(`posts/${post.id}`);
                await postRef.set({
                    ...post,
                    userId: userId,
                    synced: true,
                    syncedAt: new Date().toISOString()
                });
                
                // Mark as synced locally
                const updatedPosts = this.getItem('posts', []);
                const index = updatedPosts.findIndex(p => p.id === post.id);
                if (index >= 0) {
                    updatedPosts[index].synced = true;
                    this.setItem('posts', updatedPosts);
                }
            } catch (error) {
                console.error(`Failed to sync post ${post.id}:`, error);
            }
        }
    }
    
    async syncUserProfile(userId) {
        const localProfile = this.getItem(`profile_${userId}`);
        if (localProfile && !localProfile.synced) {
            try {
                await this.firebaseDb.ref(`users/${userId}/profile`).set({
                    ...localProfile,
                    synced: true,
                    lastSynced: new Date().toISOString()
                });
            } catch (error) {
                console.error('Failed to sync user profile:', error);
            }
        }
    }
}

// Create singleton instance
const storage = new StorageManager();

// Make available globally
window.storage = storage;