// assets/js/chatbot.js
import geminiAI from './gemini.js';
import { APP_NAME, DEBUG } from '../../config/env.js';

export function initChatbot() {
    const chatbot = document.getElementById('chatbot-container');
    if (!chatbot) return;
    
    const messagesContainer = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const toggleBtn = document.getElementById('chat-toggle');
    const closeBtn = document.getElementById('chat-close');
    
    let isOpen = false;
    let currentContext = {};
    
    // Initial greeting
    addMessage(`Hello! I'm ${APP_NAME}, your coding assistant. How can I help you today?`, 'bot');
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    toggleBtn.addEventListener('click', toggleChatbot);
    closeBtn.addEventListener('click', toggleChatbot);
    
    // Update context when file changes (for editor page)
    if (window.editor) {
        window.addEventListener('fileChange', (e) => {
            currentContext = {
                ...currentContext,
                currentFile: {
                    name: e.detail.filename,
                    type: e.detail.filename.split('.').pop(),
                    content: e.detail.content
                }
            };
        });
        
        window.addEventListener('errorDetected', (e) => {
            currentContext = {
                ...currentContext,
                error: e.detail
            };
        });
    }
    
    function toggleChatbot() {
        isOpen = !isOpen;
        chatbot.classList.toggle('open', isOpen);
        
        if (isOpen) {
            input.focus();
        }
    }
    
    async function sendMessage() {
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Get AI response with context
            const response = await geminiAI.generateResponse(message, currentContext);
            
            // Remove typing indicator
            hideTypingIndicator();
            
            // Add AI response
            if (response.success) {
                addMessage(response.text, 'bot');
            } else {
                addMessage(response.text, 'bot error');
                
                if (DEBUG) {
                    console.warn('AI Response failed:', response.error);
                }
            }
            
        } catch (error) {
            hideTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.', 'bot error');
            
            if (DEBUG) {
                console.error('Chat error:', error);
            }
        }
    }
    
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} animate-slide-up`;
        
        // Format code blocks if present
        const formattedText = formatMessage(text);
        
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="avatar">
                    <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
                </div>
                <div class="text">${formattedText}</div>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function formatMessage(text) {
        // Replace code blocks with formatted HTML
        return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || 'plaintext';
            return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
        }).replace(/`([^`]+)`/g, '<code>$1</code>') // Inline code
          .replace(/\n/g, '<br>'); // Line breaks
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'typing-indicator';
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        `;
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }
    
    // Quick action buttons (optional)
    function addQuickActions() {
        const actions = [
            { text: "Help me debug", icon: "fa-bug" },
            { text: "Generate code", icon: "fa-code" },
            { text: "Explain this", icon: "fa-question-circle" },
            { text: "Best practices", icon: "fa-check-circle" }
        ];
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'quick-actions flex gap-2 p-2';
        actionsDiv.innerHTML = actions.map(action => `
            <button class="btn-secondary text-xs px-3 py-1" onclick="setChatInput('${action.text}')">
                <i class="fas ${action.icon} mr-1"></i>${action.text}
            </button>
        `).join('');
        
        messagesContainer.appendChild(actionsDiv);
    }
    
    // Make setChatInput available globally
    window.setChatInput = (text) => {
        input.value = text;
        input.focus();
    };
                }
