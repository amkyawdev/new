// assets/js/chatbot.js
import geminiAI from './gemini.js';

export function initChatbot() {
    const chatbot = document.getElementById('chatbot-container');
    if (!chatbot) return;
    
    const messagesContainer = document.getElementById('chat-messages');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const toggleBtn = document.getElementById('chat-toggle');
    const closeBtn = document.getElementById('chat-close');
    const suggestions = document.querySelectorAll('.suggestion-btn');
    
    let isOpen = false;
    
    // Toggle chatbot
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleChatbot);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', toggleChatbot);
    }
    
    // Send message
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
    
    // Quick suggestions
    suggestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const suggestion = btn.dataset.suggestion;
            const messages = {
                'help': 'Can you help me with my code?',
                'code': 'Generate a simple todo app',
                'debug': 'Help me debug this error',
                'explain': 'Explain this code to me'
            };
            if (input) {
                input.value = messages[suggestion] || '';
                sendMessage();
            }
        });
    });
    
    function toggleChatbot() {
        isOpen = !isOpen;
        chatbot.classList.toggle('open', isOpen);
        
        if (isOpen && input) {
            input.focus();
        }
    }
    
    async function sendMessage() {
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Get current context
            const context = getCurrentContext();
            
            // Get AI response
            const response = await geminiAI.generateResponse(message, context);
            
            // Remove typing indicator
            hideTypingIndicator();
            
            // Add AI response
            if (response.success) {
                addMessage(response.text, 'bot');
            } else {
                addMessage(response.text, 'bot error');
            }
            
        } catch (error) {
            hideTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.', 'bot error');
            console.error('Chat error:', error);
        }
    }
    
    function addMessage(text, sender) {
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} animate-slide-up`;
        
        // Format code blocks
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
        // Replace code blocks
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || 'plaintext';
            return `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`;
        });
        
        // Replace inline code
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Replace line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function showTypingIndicator() {
        if (!messagesContainer) return;
        
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
    
    function getCurrentContext() {
        const context = {
            url: window.location.pathname,
            timestamp: new Date().toISOString()
        };
        
        // Add editor context if available
        if (window.editor && window.currentFile) {
            context.currentFile = {
                name: window.currentFile,
                content: window.editor.getValue()
            };
        }
        
        return context;
    }
            }
