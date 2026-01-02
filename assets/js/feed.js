/**
 * @license
 * Copyright 2023 BurmeWeb
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Feed Manager Module
class FeedManager {
    constructor() {
        this.posts = [];
        this.currentUser = null;
        this.isLoading = false;
        this.lastPostKey = null;
        this.pageSize = 10;
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        // Wait for auth to be ready
        if (window.AuthManager && window.AuthManager.currentUser) {
            this.currentUser = window.AuthManager.currentUser;
            await this.loadUserProfile();
            await this.loadPosts();
            await this.loadSidebarData();
            this.setupEventListeners();
        } else {
            // Listen for auth state changes
            setTimeout(() => this.init(), 100);
        }
    }

    async loadUserProfile() {
        if (!this.currentUser) return;
        
        try {
            const snapshot = await firebase.database().ref('users/' + this.currentUser.uid).once('value');
            if (snapshot.exists()) {
                const userData = snapshot.val();
                
                // Update UI
                document.getElementById('userDisplayName')?.textContent = userData.displayName || this.currentUser.displayName;
                document.getElementById('userBio')?.textContent = userData.bio || '';
                document.getElementById('userAvatar')?.src = userData.profileImage || this.currentUser.photoURL || '../assets/img/default-avatar.png';
                document.getElementById('currentUserAvatar')?.src = userData.profileImage || this.currentUser.photoURL || '../assets/img/default-avatar.png';
                
                // Set online status
                await this.updateOnlineStatus(true);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async updateOnlineStatus(isOnline) {
        if (!this.currentUser) return;
        
        try {
            await firebase.database().ref('users/' + this.currentUser.uid + '/isOnline').set(isOnline);
            
            // Update last seen timestamp when going offline
            if (!isOnline) {
                await firebase.database().ref('users/' + this.currentUser.uid + '/lastSeen').set(new Date().toISOString());
            }
        } catch (error) {
            console.error('Error updating online status:', error);
        }
    }

    async loadSidebarData() {
        await this.loadOnlineFriends();
        await this.loadSuggestedGroups();
        await this.loadUpcomingEvents();
    }

    async loadOnlineFriends() {
        try {
            const friendsList = document.querySelector('.friends-list');
            if (!friendsList) return;

            // Mock data for now - in real app, fetch from database
            const friends = [
                {
                    id: '2',
                    name: 'Su Su',
                    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
                    status: 'online'
                },
                {
                    id: '3',
                    name: 'Htet Aung',
                    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
                    status: 'online'
                }
            ];

            friendsList.innerHTML = friends.map(friend => `
                <div class="friend-item">
                    <img src="${friend.avatar}" alt="${friend.name}" class="friend-avatar">
                    <div class="friend-info">
                        <span class="friend-name">${friend.name}</span>
                        <span class="friend-status ${friend.status}">${friend.status === 'online' ? 'Online' : 'Offline'}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading friends:', error);
        }
    }

    async loadSuggestedGroups() {
        try {
            const groupsContainer = document.getElementById('suggestedGroups');
            if (!groupsContainer) return;

            const groups = [
                {
                    id: '1',
                    name: 'Yangon Tech Community',
                    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
                    members: 156
                },
                {
                    id: '2',
                    name: 'Myanmar Entrepreneurs',
                    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80',
                    members: 89
                }
            ];

            groupsContainer.innerHTML = groups.map(group => `
                <div class="group-item">
                    <img src="${group.image}" alt="${group.name}" class="group-avatar">
                    <div class="group-info">
                        <span class="group-name">${group.name}</span>
                        <span class="group-members">${group.members} members</span>
                    </div>
                    <button class="btn btn-sm btn-outline" data-group-id="${group.id}">Join</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }

    async loadUpcomingEvents() {
        try {
            const eventsContainer = document.getElementById('upcomingEvents');
            if (!eventsContainer) return;

            const events = [
                {
                    title: 'Tech Meetup Yangon',
                    date: '15 Oct',
                    time: '6:00 PM • Online'
                },
                {
                    title: 'Business Networking',
                    date: '20 Oct',
                    time: '3:00 PM • Mandalay'
                }
            ];

            eventsContainer.innerHTML = events.map(event => `
                <div class="event-item">
                    <div class="event-date">
                        <span class="event-day">${event.date.split(' ')[0]}</span>
                        <span class="event-month">${event.date.split(' ')[1]}</span>
                    </div>
                    <div class="event-info">
                        <span class="event-title">${event.title}</span>
                        <span class="event-time">${event.time}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading events:', error);
        }
    }

    async loadPosts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading(true);
        
        try {
            let query = firebase.database().ref('posts').orderByChild('timestamp').limitToLast(this.pageSize);
            
            if (this.lastPostKey) {
                query = query.endAt(this.lastPostKey);
            }
            
            const snapshot = await query.once('value');
            const newPosts = [];
            
            snapshot.forEach((childSnapshot) => {
                const post = childSnapshot.val();
                post.id = childSnapshot.key;
                newPosts.unshift(post); // Reverse order to get newest first
            });
            
            if (newPosts.length > 0) {
                this.lastPostKey = newPosts[newPosts.length - 1].timestamp;
                this.posts = [...newPosts, ...this.posts];
                this.renderPosts(newPosts);
            }
            
            // Show/hide load more button
            this.toggleLoadMoreButton(newPosts.length === this.pageSize);
        } catch (error) {
            console.error('Error loading posts:', error);
            this.showError('Failed to load posts. Please try again.');
        } finally {
            this.isLoading = false;
            this.showLoading(false);
        }
    }

    async createPost(content, imageUrl = null) {
        if (!this.currentUser || !content.trim()) {
            this.showNotification('Please write something to post', 'warning');
            return;
        }
        
        try {
            // Get user data
            const userSnapshot = await firebase.database().ref('users/' + this.currentUser.uid).once('value');
            const userData = userSnapshot.val();
            
            const postData = {
                userId: this.currentUser.uid,
                username: userData.username || this.currentUser.displayName,
                userImage: userData.profileImage || this.currentUser.photoURL || '',
                content: content.trim(),
                image: imageUrl,
                likes: 0,
                comments: 0,
                shares: 0,
                timestamp: new Date().toISOString(),
                likedBy: []
            };
            
            // Save to database
            const newPostRef = firebase.database().ref('posts').push();
            await newPostRef.set(postData);
            
            // Add to local posts and render
            postData.id = newPostRef.key;
            this.posts.unshift(postData);
            this.renderPosts([postData], true);
            
            // Show success message
            this.showNotification('Post published successfully!', 'success');
            
            return postData.id;
        } catch (error) {
            console.error('Error creating post:', error);
            this.showError('Failed to create post. Please try again.');
            return null;
        }
    }

    async likePost(postId) {
        if (!this.currentUser) {
            this.showNotification('Please login to like posts', 'warning');
            return;
        }
        
        try {
            const postRef = firebase.database().ref('posts/' + postId);
            const postSnapshot = await postRef.once('value');
            const post = postSnapshot.val();
            
            if (!post) return;
            
            const likedBy = post.likedBy || [];
            const isLiked = likedBy.includes(this.currentUser.uid);
            
            if (isLiked) {
                // Unlike
                const newLikedBy = likedBy.filter(uid => uid !== this.currentUser.uid);
                await postRef.update({
                    likes: post.likes - 1,
                    likedBy: newLikedBy
                });
                
                // Update UI
                this.updatePostLikeStatus(postId, false, post.likes - 1);
            } else {
                // Like
                const newLikedBy = [...likedBy, this.currentUser.uid];
                await postRef.update({
                    likes: post.likes + 1,
                    likedBy: newLikedBy
                });
                
                // Update UI
                this.updatePostLikeStatus(postId, true, post.likes + 1);
            }
        } catch (error) {
            console.error('Error liking post:', error);
            this.showError('Failed to like post. Please try again.');
        }
    }

    async addComment(postId, commentText) {
        if (!this.currentUser || !commentText.trim()) return;
        
        try {
            // Get user data
            const userSnapshot = await firebase.database().ref('users/' + this.currentUser.uid).once('value');
            const userData = userSnapshot.val();
            
            const commentData = {
                userId: this.currentUser.uid,
                username: userData.username || this.currentUser.displayName,
                userImage: userData.profileImage || this.currentUser.photoURL || '',
                content: commentText.trim(),
                timestamp: new Date().toISOString()
            };
            
            // Add comment to post
            const commentRef = firebase.database().ref('posts/' + postId + '/comments').push();
            await commentRef.set(commentData);
            
            // Update comment count
            const postRef = firebase.database().ref('posts/' + postId);
            const postSnapshot = await postRef.once('value');
            const post = postSnapshot.val();
            
            await postRef.update({
                comments: (post.comments || 0) + 1
            });
            
            // Update UI
            this.updatePostCommentCount(postId, (post.comments || 0) + 1);
            
            return commentRef.key;
        } catch (error) {
            console.error('Error adding comment:', error);
            this.showError('Failed to add comment. Please try again.');
            return null;
        }
    }

    async sharePost(postId) {
        if (!this.currentUser) {
            this.showNotification('Please login to share posts', 'warning');
            return;
        }
        
        try {
            const postRef = firebase.database().ref('posts/' + postId);
            const postSnapshot = await postRef.once('value');
            const post = postSnapshot.val();
            
            if (!post) return;
            
            // Update share count
            await postRef.update({
                shares: (post.shares || 0) + 1
            });
            
            // Update UI
            this.updatePostShareCount(postId, (post.shares || 0) + 1);
            
            // Show success message
            this.showNotification('Post shared successfully!', 'success');
        } catch (error) {
            console.error('Error sharing post:', error);
            this.showError('Failed to share post. Please try again.');
        }
    }

    async deletePost(postId) {
        if (!this.currentUser) return;
        
        try {
            // Check if user owns the post
            const postRef = firebase.database().ref('posts/' + postId);
            const postSnapshot = await postRef.once('value');
            const post = postSnapshot.val();
            
            if (!post || post.userId !== this.currentUser.uid) {
                this.showNotification('You can only delete your own posts', 'warning');
                return;
            }
            
            // Confirm deletion
            if (!confirm('Are you sure you want to delete this post?')) {
                return;
            }
            
            // Delete post
            await postRef.remove();
            
            // Remove from local posts
            this.posts = this.posts.filter(post => post.id !== postId);
            
            // Remove from UI
            this.removePostFromUI(postId);
            
            this.showNotification('Post deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showError('Failed to delete post. Please try again.');
        }
    }

    // UI Rendering Methods
    renderPosts(posts, prepend = false) {
        const container = document.getElementById('postsContainer');
        if (!container) return;
        
        const postsHTML = posts.map(post => this.createPostHTML(post)).join('');
        
        if (prepend) {
            container.insertAdjacentHTML('afterbegin', postsHTML);
        } else {
            container.insertAdjacentHTML('beforeend', postsHTML);
        }
        
        // Attach event listeners to new posts
        this.attachPostEventListeners(posts.map(p => p.id));
    }

    createPostHTML(post) {
        const isLiked = post.likedBy && post.likedBy.includes(this.currentUser?.uid);
        const timeAgo = this.getTimeAgo(post.timestamp);
        
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <img src="${post.userImage || '../assets/img/default-avatar.png'}" 
                         alt="${post.username}" 
                         class="post-user-avatar">
                    <div class="post-user-info">
                        <a href="profile.html?id=${post.userId}" class="post-username">${post.username}</a>
                        <div class="post-time">${timeAgo}</div>
                    </div>
                    ${post.userId === this.currentUser?.uid ? `
                        <button class="post-options-btn" data-post-id="${post.id}" title="Post options">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    ` : ''}
                </div>
                
                <div class="post-content">
                    <p>${this.escapeHTML(post.content)}</p>
                    ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image" loading="lazy">` : ''}
                </div>
                
                <div class="post-stats">
                    <span>${post.likes || 0} likes</span>
                    <span> • </span>
                    <span>${post.comments || 0} comments</span>
                    <span> • </span>
                    <span>${post.shares || 0} shares</span>
                </div>
                
                <div class="post-actions">
                    <button class="post-action ${isLiked ? 'liked' : ''}" data-action="like" data-post-id="${post.id}">
                        <i class="fas fa-heart"></i>
                        <span>Like</span>
                    </button>
                    <button class="post-action" data-action="comment" data-post-id="${post.id}">
                        <i class="fas fa-comment"></i>
                        <span>Comment</span>
                    </button>
                    <button class="post-action" data-action="share" data-post-id="${post.id}">
                        <i class="fas fa-share"></i>
                        <span>Share</span>
                    </button>
                </div>
                
                <div class="comments-section" id="comments-${post.id}" style="display: none;">
                    <div class="comment-input">
                        <img src="${this.currentUser?.photoURL || '../assets/img/default-avatar.png'}" 
                             alt="Your avatar" 
                             class="comment-avatar">
                        <div class="comment-form">
                            <input type="text" 
                                   class="comment-input-field" 
                                   placeholder="Write a comment..." 
                                   data-post-id="${post.id}">
                            <button class="btn btn-primary btn-sm comment-submit" data-post-id="${post.id}">Post</button>
                        </div>
                    </div>
                    <div class="comments-list" id="comments-list-${post.id}">
                        <!-- Comments will be loaded here -->
                    </div>
                </div>
            </div>
        `;
    }

    attachPostEventListeners(postIds) {
        postIds.forEach(postId => {
            // Like button
            const likeBtn = document.querySelector(`[data-post-id="${postId}"][data-action="like"]`);
            if (likeBtn) {
                likeBtn.addEventListener('click', () => this.likePost(postId));
            }

            // Comment button
            const commentBtn = document.querySelector(`[data-post-id="${postId}"][data-action="comment"]`);
            if (commentBtn) {
                commentBtn.addEventListener('click', () => this.toggleComments(postId));
            }

            // Share button
            const shareBtn = document.querySelector(`[data-post-id="${postId}"][data-action="share"]`);
            if (shareBtn) {
                shareBtn.addEventListener('click', () => this.sharePost(postId));
            }

            // Post options button
            const optionsBtn = document.querySelector(`.post-options-btn[data-post-id="${postId}"]`);
            if (optionsBtn) {
                optionsBtn.addEventListener('click', (e) => this.showPostOptions(e, postId));
            }

            // Comment input
            const commentInput = document.querySelector(`.comment-input-field[data-post-id="${postId}"]`);
            const commentSubmit = document.querySelector(`.comment-submit[data-post-id="${postId}"]`);
            
            if (commentInput && commentSubmit) {
                const submitComment = () => {
                    const comment = commentInput.value.trim();
                    if (comment) {
                        this.addComment(postId, comment);
                        commentInput.value = '';
                    }
                };

                commentInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') submitComment();
                });

                commentSubmit.addEventListener('click', submitComment);
            }
        });
    }

    // Utility Methods
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getTimeAgo(timestamp) {
        const now = new Date();
        const postDate = new Date(timestamp);
        const diffMs = now - postDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return postDate.toLocaleDateString();
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }

    toggleLoadMoreButton(show) {
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer) {
            loadMoreContainer.style.display = show ? 'block' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        if (window.BurmeWeb && window.BurmeWeb.showNotification) {
            window.BurmeWeb.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // Event Handlers
    setupEventListeners() {
        // Post button
        const postButton = document.getElementById('postButton');
        if (postButton) {
            postButton.addEventListener('click', () => {
                const content = document.getElementById('postContent')?.value.trim();
                if (content) {
                    this.createPost(content);
                    document.getElementById('postContent').value = '';
                }
            });
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadPosts());
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.filterPosts(this.currentFilter);
            });
        });

        // Post options
        document.querySelectorAll('.post-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.handlePostOption(type);
            });
        });

        // Join group buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn[data-group-id]')) {
                const groupId = e.target.closest('.btn').dataset.groupId;
                this.joinGroup(groupId);
            }
        });
    }

    filterPosts(filter) {
        // In a real app, this would filter posts based on the filter type
        console.log('Filtering posts by:', filter);
        // For now, just reload all posts
        this.posts = [];
        document.getElementById('postsContainer').innerHTML = '';
        this.lastPostKey = null;
        this.loadPosts();
    }

    toggleComments(postId) {
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (commentsSection) {
            const isVisible = commentsSection.style.display !== 'none';
            commentsSection.style.display = isVisible ? 'none' : 'block';
            
            if (!isVisible) {
                this.loadComments(postId);
            }
        }
    }

    async loadComments(postId) {
        try {
            const commentsList = document.getElementById(`comments-list-${postId}`);
            if (!commentsList) return;

            const snapshot = await firebase.database().ref(`posts/${postId}/comments`).once('value');
            const comments = [];
            
            snapshot.forEach((childSnapshot) => {
                const comment = childSnapshot.val();
                comment.id = childSnapshot.key;
                comments.push(comment);
            });

            // Sort by timestamp
            comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            commentsList.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <img src="${comment.userImage || '../assets/img/default-avatar.png'}" 
                         alt="${comment.username}" 
                         class="comment-avatar">
                    <div class="comment-content">
                        <a href="profile.html?id=${comment.userId}" class="comment-author">${comment.username}</a>
                        <p class="comment-text">${this.escapeHTML(comment.content)}</p>
                        <div class="comment-time">${this.getTimeAgo(comment.timestamp)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    showPostOptions(e, postId) {
        // Create options menu
        const menu = document.createElement('div');
        menu.className = 'post-options-menu';
        menu.innerHTML = `
            <button class="option-item" data-action="delete">Delete Post</button>
            <button class="option-item" data-action="edit">Edit Post</button>
            <button class="option-item" data-action="report">Report</button>
        `;

        // Position menu
        menu.style.position = 'absolute';
        menu.style.top = `${e.target.offsetTop + 30}px`;
        menu.style.right = '20px';
        menu.style.zIndex = '1000';

        // Add to document
        document.body.appendChild(menu);

        // Handle clicks
        menu.addEventListener('click', (event) => {
            const action = event.target.dataset.action;
            if (action === 'delete') {
                this.deletePost(postId);
            }
            menu.remove();
        });

        // Remove menu when clicking outside
        setTimeout(() => {
            const removeMenu = (clickEvent) => {
                if (!menu.contains(clickEvent.target)) {
                    menu.remove();
                    document.removeEventListener('click', removeMenu);
                }
            };
            document.addEventListener('click', removeMenu);
        }, 0);
    }

    handlePostOption(type) {
        switch(type) {
            case 'photo':
                this.showNotification('Photo upload feature coming soon!', 'info');
                break;
            case 'video':
                this.showNotification('Video upload feature coming soon!', 'info');
                break;
            case 'poll':
                this.showNotification('Poll creation feature coming soon!', 'info');
                break;
        }
    }

    async joinGroup(groupId) {
        if (!this.currentUser) {
            this.showNotification('Please login to join groups', 'warning');
            return;
        }

        try {
            // In a real app, add user to group in database
            this.showNotification('Joined group successfully!', 'success');
            
            // Update button text
            const joinBtn = document.querySelector(`[data-group-id="${groupId}"]`);
            if (joinBtn) {
                joinBtn.textContent = 'Joined';
                joinBtn.disabled = true;
                joinBtn.classList.remove('btn-outline');
                joinBtn.classList.add('btn-success');
            }
        } catch (error) {
            console.error('Error joining group:', error);
            this.showError('Failed to join group. Please try again.');
        }
    }

    // Update UI methods
    updatePostLikeStatus(postId, isLiked, likeCount) {
        const likeBtn = document.querySelector(`[data-post-id="${postId}"][data-action="like"]`);
        const statsElement = document.querySelector(`[data-post-id="${postId}"] .post-stats`);
        
        if (likeBtn) {
            likeBtn.classList.toggle('liked', isLiked);
            likeBtn.querySelector('span').textContent = isLiked ? 'Liked' : 'Like';
        }
        
        if (statsElement) {
            statsElement.querySelector('span').textContent = `${likeCount} likes`;
        }
    }

    updatePostCommentCount(postId, commentCount) {
        const statsElement = document.querySelector(`[data-post-id="${postId}"] .post-stats`);
        if (statsElement) {
            const spans = statsElement.querySelectorAll('span');
            spans[2].textContent = `${commentCount} comments`;
        }
    }

    updatePostShareCount(postId, shareCount) {
        const statsElement = document.querySelector(`[data-post-id="${postId}"] .post-stats`);
        if (statsElement) {
            const spans = statsElement.querySelectorAll('span');
            spans[4].textContent = `${shareCount} shares`;
        }
    }

    removePostFromUI(postId) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            postElement.remove();
        }
    }

    addCommentToUI(postId, commentData) {
        const commentsList = document.getElementById(`comments-list-${postId}`);
        if (commentsList) {
            const commentHTML = `
                <div class="comment-item">
                    <img src="${commentData.userImage || '../assets/img/default-avatar.png'}" 
                         alt="${commentData.username}" 
                         class="comment-avatar">
                    <div class="comment-content">
                        <a href="profile.html?id=${commentData.userId}" class="comment-author">${commentData.username}</a>
                        <p class="comment-text">${this.escapeHTML(commentData.content)}</p>
                        <div class="comment-time">${this.getTimeAgo(commentData.timestamp)}</div>
                    </div>
                </div>
            `;
            commentsList.insertAdjacentHTML('afterbegin', commentHTML);
        }
    }
}

// Initialize Feed Manager
let feedManager = null;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        feedManager = new FeedManager();
        window.FeedManager = feedManager;
    }
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (feedManager && !document.hidden) {
        feedManager.updateOnlineStatus(true);
    }
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (feedManager) {
        feedManager.updateOnlineStatus(false);
    }
});