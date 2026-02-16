// assets/js/gemini.js
import { GEMINI_API_KEY, GEMINI_MODEL, GEMINI_API_URL, ERROR_MESSAGES, DEBUG } from '../../config/env.js';

class GeminiAI {
    constructor() {
        this.apiKey = GEMINI_API_KEY;
        this.model = GEMINI_MODEL;
        this.baseUrl = GEMINI_API_URL;
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
    }

    async generateResponse(prompt, context = {}) {
        try {
            // Check if API key is available
            if (!this.apiKey || this.apiKey === 'YOUR_GEMINI_API_KEY') {
                throw new Error('Gemini API key is not configured');
            }

            // Prepare the request payload
            const payload = {
                contents: [{
                    parts: [{
                        text: this.buildPromptWithContext(prompt, context)
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };

            // Add conversation history if available
            if (this.conversationHistory.length > 0) {
                payload.contents = [
                    ...this.conversationHistory.slice(-this.maxHistoryLength),
                    ...payload.contents
                ];
            }

            // Make API request
            const response = await fetch(
                `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Gemini API request failed');
            }

            const data = await response.json();
            
            // Extract the generated text
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Update conversation history
            this.updateHistory(prompt, generatedText);
            
            return {
                success: true,
                text: generatedText,
                raw: data
            };

        } catch (error) {
            console.error('Gemini API Error:', error);
            
            if (DEBUG) {
                console.error('Full error details:', error);
            }
            
            return {
                success: false,
                error: error.message || ERROR_MESSAGES.AI_SERVICE,
                text: this.getFallbackResponse(prompt)
            };
        }
    }

    buildPromptWithContext(prompt, context) {
        let contextualPrompt = '';
        
        // Add system context
        contextualPrompt += `You are Burme AI, a helpful coding assistant. `;
        contextualPrompt += `You help developers write better code, debug issues, and learn programming. `;
        contextualPrompt += `Keep responses concise, practical, and focused on coding. `;
        
        // Add project context if available
        if (context.project) {
            contextualPrompt += `\n\nCurrent Project: ${context.project.name}`;
            contextualPrompt += `\nProject Type: ${context.project.type || 'web'}`;
        }
        
        // Add file context if available
        if (context.currentFile) {
            contextualPrompt += `\nCurrent File: ${context.currentFile.name}`;
            contextualPrompt += `\nFile Type: ${context.currentFile.type}`;
            
            if (context.currentFile.content) {
                contextualPrompt += `\n\nFile Content:\n\`\`\`${context.currentFile.type}\n${context.currentFile.content}\n\`\`\``;
            }
        }
        
        // Add code selection if available
        if (context.selectedCode) {
            contextualPrompt += `\n\nSelected Code:\n\`\`\`\n${context.selectedCode}\n\`\`\``;
        }
        
        // Add error context if available
        if (context.error) {
            contextualPrompt += `\n\nError: ${context.error.message}`;
            if (context.error.line) {
                contextualPrompt += ` at line ${context.error.line}`;
            }
        }
        
        // Add the user's prompt
        contextualPrompt += `\n\nUser: ${prompt}\n\nAssistant: `;
        
        return contextualPrompt;
    }

    updateHistory(prompt, response) {
        this.conversationHistory.push({
            role: 'user',
            parts: [{ text: prompt }]
        });
        
        this.conversationHistory.push({
            role: 'model',
            parts: [{ text: response }]
        });
        
        // Keep only recent history
        if (this.conversationHistory.length > this.maxHistoryLength * 2) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
        }
    }

    getFallbackResponse(prompt) {
        // Simple fallback responses when AI is unavailable
        const fallbacks = [
            "I'm here to help! Could you please try asking your question again?",
            "I'm processing your request. Can you rephrase that?",
            "Let me help you with that. What specifically would you like to know?",
            "I understand you need assistance. Could you provide more details?",
            "I'm ready to help with your coding questions. What would you like to know?"
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    async analyzeCode(code, language) {
        const prompt = `Analyze this ${language} code and provide:
1. Potential bugs or issues
2. Performance improvements
3. Best practices suggestions
4. Security concerns (if any)

Code:
\`\`\`${language}
${code}
\`\`\``;

        return this.generateResponse(prompt, { 
            currentFile: { type: language, content: code } 
        });
    }

    async generateCode(description, language) {
        const prompt = `Generate ${language} code for the following description:
${description}

Provide only the code with minimal explanation.`;

        return this.generateResponse(prompt, { 
            project: { type: language } 
        });
    }

    async explainCode(code, language) {
        const prompt = `Explain this ${language} code in simple terms:
\`\`\`${language}
${code}
\`\`\`

Provide a clear, beginner-friendly explanation.`;

        return this.generateResponse(prompt);
    }

    async debugError(error, code, language) {
        const prompt = `Help me debug this ${language} error:

Error: ${error.message}
Line: ${error.line || 'unknown'}

Code:
\`\`\`${language}
${code}
\`\`\`

Explain the cause and provide the fix.`;

        return this.generateResponse(prompt, { error });
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    setMaxHistoryLength(length) {
        this.maxHistoryLength = length;
    }
}

// Create and export a singleton instance
const geminiAI = new GeminiAI();
export default geminiAI;
