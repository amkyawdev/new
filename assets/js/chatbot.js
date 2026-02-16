// assets/js/chatbot.js
import { ENV } from '../../config/env.js';

export function initChatbot() {
    const chatbot = document.getElementById('chatbot-container');
    if (!chatbot) return;
    
    const messages = [];
    
    // Initial greeting
    addMessage('Hello! I\'m Burme AI, your coding assistant. How can I help you today?', 'bot');
    
    document.getElementById('chat-send').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    async function sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (!message) return;
        
        addMessage(message, 'user');
        input.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            const response = await getGeminiResponse(message);
            hideTypingIndicator();
            addMessage(response, 'bot');
        } catch (error) {
            hideTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
    }
    
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender} animate-slide-up`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="avatar">
                    <i class="fas ${sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
                </div>
                <div class="text">${text}</div>
            </div>
        `;
        
        document.getElementById('chat-messages').appendChild(messageDiv);
        messageDiv.scrollIntoView({ behavior: 'smooth' });
        
        messages.push({ text, sender });
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
        document.getElementById('chat-messages').appendChild(indicator);
    }
    
    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }
    
    async function getGeminiResponse(message) {
        // Gemini API integration
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${ENV.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: message
                    }]
                }]
            })
        });
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }
}
