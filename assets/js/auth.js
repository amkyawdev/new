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

// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.auth = firebase.auth();
        this.init();
    }

    init() {
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.onAuthStateChanged(user);
        });
    }

    onAuthStateChanged(user) {
        // Update UI based on auth state
        if (user) {
            this.showUserMenu(user);
            this.redirectIfNeeded();
        } else {
            this.showLoginMenu();
        }
    }

    // Email/Password Authentication
    async signUp(email, password, username) {
        try {
            // Create user with email and password
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Update profile with username
            await userCredential.user.updateProfile({
                displayName: username
            });

            // Send email verification
            await this.sendEmailVerification(userCredential.user);

            // Create user data in database
            await this.createUserProfile(userCredential.user.uid, username, email);

            return {
                success: true,
                user: userCredential.user,
                message: 'Account created successfully! Please check your email for verification.'
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code),
                code: error.code
            };
        }
    }

    async signIn(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            // Update last login time
            await this.updateLastLogin(userCredential.user.uid);

            return {
                success: true,
                user: userCredential.user
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code),
                code: error.code
            };
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Email Verification
    async sendEmailVerification(user) {
        try {
            await user.sendEmailVerification({
                url: window.location.origin + '/pages/profile.html',
                handleCodeInApp: true
            });
            return true;
        } catch (error) {
            console.error('Error sending verification email:', error);
            return false;
        }
    }

    async verifyEmail(actionCode, continueUrl) {
        try {
            // Apply the email verification code
            await this.auth.applyActionCode(actionCode);
            
            // Email verified successfully
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Password Reset
    async sendPasswordResetEmail(email) {
        try {
            await this.auth.sendPasswordResetEmail(email, {
                url: window.location.origin + '/pages/login.html',
                handleCodeInApp: true
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    async confirmPasswordReset(code, newPassword) {
        try {
            await this.auth.confirmPasswordReset(code, newPassword);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // User Profile Management
    async createUserProfile(uid, username, email) {
        try {
            const userData = {
                username: username,
                email: email,
                displayName: username,
                profileImage: '',
                bio: '',
                location: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isEmailVerified: false,
                friends: [],
                groups: [],
                settings: {
                    theme: 'light',
                    language: 'my',
                    notifications: true,
                    privacy: 'public'
                }
            };

            await firebase.database().ref('users/' + uid).set(userData);
            return true;
        } catch (error) {
            console.error('Error creating user profile:', error);
            return false;
        }
    }

    async updateUserProfile(data) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            // Update Firebase profile
            const updates = {};
            if (data.displayName) updates.displayName = data.displayName;
            if (data.photoURL) updates.photoURL = data.photoURL;

            if (Object.keys(updates).length > 0) {
                await this.currentUser.updateProfile(updates);
            }

            // Update database profile
            const dbUpdates = {};
            if (data.username) dbUpdates.username = data.username;
            if (data.bio) dbUpdates.bio = data.bio;
            if (data.location) dbUpdates.location = data.location;

            if (Object.keys(dbUpdates).length > 0) {
                await firebase.database().ref('users/' + this.currentUser.uid).update(dbUpdates);
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    async updateLastLogin(uid) {
        try {
            await firebase.database().ref('users/' + uid + '/lastLogin').set(new Date().toISOString());
            return true;
        } catch (error) {
            console.error('Error updating last login:', error);
            return false;
        }
    }

    // Social Authentication
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await this.auth.signInWithPopup(provider);
            
            // Check if user exists in database, create if not
            const userExists = await this.checkUserExists(result.user.uid);
            if (!userExists) {
                await this.createSocialUserProfile(result.user);
            }

            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    async signInWithFacebook() {
        try {
            const provider = new firebase.auth.FacebookAuthProvider();
            provider.addScope('email');
            provider.addScope('public_profile');
            
            const result = await this.auth.signInWithPopup(provider);
            
            // Check if user exists in database, create if not
            const userExists = await this.checkUserExists(result.user.uid);
            if (!userExists) {
                await this.createSocialUserProfile(result.user);
            }

            return {
                success: true,
                user: result.user
            };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    async createSocialUserProfile(user) {
        try {
            const userData = {
                username: user.displayName || user.email.split('@')[0],
                email: user.email,
                displayName: user.displayName,
                profileImage: user.photoURL || '',
                bio: '',
                location: '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isEmailVerified: user.emailVerified,
                friends: [],
                groups: [],
                settings: {
                    theme: 'light',
                    language: 'my',
                    notifications: true,
                    privacy: 'public'
                }
            };

            await firebase.database().ref('users/' + user.uid).set(userData);
            return true;
        } catch (error) {
            console.error('Error creating social user profile:', error);
            return false;
        }
    }

    async checkUserExists(uid) {
        try {
            const snapshot = await firebase.database().ref('users/' + uid).once('value');
            return snapshot.exists();
        } catch (error) {
            console.error('Error checking user existence:', error);
            return false;
        }
    }

    // User Management
    async deleteAccount() {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            // Delete user data from database
            await firebase.database().ref('users/' + this.currentUser.uid).remove();
            
            // Delete user from Firebase Auth
            await this.currentUser.delete();
            
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    async changePassword(newPassword) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            await this.currentUser.updatePassword(newPassword);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    async changeEmail(newEmail) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };

        try {
            await this.currentUser.updateEmail(newEmail);
            
            // Update email in database
            await firebase.database().ref('users/' + this.currentUser.uid + '/email').set(newEmail);
            
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: this.getErrorMessage(error.code)
            };
        }
    }

    // Helper Methods
    getErrorMessage(errorCode) {
        const errorMessages = {
            // Email/Password Errors
            'auth/invalid-email': 'Please enter a valid email address',
            'auth/user-disabled': 'This account has been disabled',
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/email-already-in-use': 'This email is already registered',
            'auth/weak-password': 'Password should be at least 6 characters',
            'auth/operation-not-allowed': 'Email/password accounts are not enabled',
            
            // Verification Errors
            'auth/expired-action-code': 'The verification code has expired',
            'auth/invalid-action-code': 'The verification code is invalid',
            'auth/user-mismatch': 'The verification code is for a different user',
            
            // Password Reset Errors
            'auth/expired-action-code': 'The password reset link has expired',
            'auth/invalid-action-code': 'The password reset link is invalid',
            
            // Social Auth Errors
            'auth/account-exists-with-different-credential': 'An account already exists with this email',
            'auth/popup-blocked': 'Popup was blocked by the browser',
            'auth/popup-closed-by-user': 'Popup was closed before completing sign in',
            'auth/unauthorized-domain': 'This domain is not authorized for OAuth operations',
            
            // General Errors
            'auth/network-request-failed': 'Network error. Please check your connection',
            'auth/too-many-requests': 'Too many attempts. Please try again later',
            'auth/requires-recent-login': 'Please sign in again to continue',
            'auth/invalid-credential': 'The credential is malformed or has expired'
        };

        return errorMessages[errorCode] || 'An error occurred. Please try again.';
    }

    // UI Management
    showUserMenu(user) {
        // Update UI elements for logged in user
        const userMenu = document.getElementById('userMenu');
        const loginLinks = document.querySelectorAll('[data-show="logged-out"]');
        const logoutLinks = document.querySelectorAll('[data-show="logged-in"]');

        if (userMenu) {
            userMenu.innerHTML = `
                <div class="user-menu">
                    <img src="${user.photoURL || '../assets/img/default-avatar.png'}" 
                         alt="${user.displayName || 'User'}" 
                         class="user-avatar">
                    <span class="user-name">${user.displayName || user.email}</span>
                    <div class="user-dropdown">
                        <a href="../pages/profile.html" class="dropdown-item">Profile</a>
                        <a href="../pages/feed.html" class="dropdown-item">Feed</a>
                        <a href="#" class="dropdown-item" id="logoutBtn">Logout</a>
                    </div>
                </div>
            `;

            // Add logout event listener
            document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.signOut();
            });
        }

        // Toggle visibility
        loginLinks.forEach(el => el.style.display = 'none');
        logoutLinks.forEach(el => el.style.display = 'block');
    }

    showLoginMenu() {
        // Update UI elements for logged out state
        const userMenu = document.getElementById('userMenu');
        const loginLinks = document.querySelectorAll('[data-show="logged-out"]');
        const logoutLinks = document.querySelectorAll('[data-show="logged-in"]');

        if (userMenu) {
            userMenu.innerHTML = `
                <a href="../pages/login.html" class="nav-link">Login</a>
                <a href="../pages/register.html" class="btn btn-primary">Sign Up</a>
            `;
        }

        // Toggle visibility
        loginLinks.forEach(el => el.style.display = 'block');
        logoutLinks.forEach(el => el.style.display = 'none');
    }

    redirectIfNeeded() {
        // Redirect from auth pages if already logged in
        const authPages = ['login.html', 'register.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (authPages.includes(currentPage) && this.currentUser) {
            window.location.href = '../pages/feed.html';
        }
    }

    // Session Management
    getSessionToken() {
        return this.currentUser ? this.currentUser.getIdToken() : null;
    }

    async refreshToken() {
        if (this.currentUser) {
            const token = await this.currentUser.getIdToken(true);
            return token;
        }
        return null;
    }

    // Validation Methods
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePassword(password) {
        const errors = [];
        
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password should contain at least one uppercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password should contain at least one number');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    validateUsername(username) {
        const re = /^[a-zA-Z0-9_]{3,30}$/;
        return re.test(username);
    }
}

// Initialize Auth Manager
let authManager = null;

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        authManager = new AuthManager();
        window.AuthManager = authManager;
    }
});
