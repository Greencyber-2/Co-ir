// DOM Elements
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.querySelector('.chat-messages');
const chatContainer = document.querySelector('.chat-container');
const closeChatBtn = document.querySelector('.close-chat');
const chatBtn = document.querySelector('.nav-btn[data-section="chatbot"]');
const chatStatus = document.getElementById('chat-status');

// Configuration
const API_ENDPOINT = 'https://lively-dream-4d36.dns555104.workers.dev/';
const TYPING_DELAY = 50; // ms between each character when showing bot response
const THINKING_DELAY = 1000; // ms to simulate "thinking"

// Initialize chat
function initChat() {
    // Add event listeners
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Chat button in navigation
    chatBtn.addEventListener('click', toggleChat);
    
    // Close chat button
    closeChatBtn.addEventListener('click', toggleChat);
}

// Toggle chat visibility
function toggleChat() {
    chatContainer.classList.toggle('active');
    
    // Scroll to bottom when chat opens
    if (chatContainer.classList.contains('active')) {
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }
}

// Send message to API
async function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;
    
    // Add user message
    addMessage(message, 'user');
    chatInput.value = '';
    chatInput.disabled = true;
    sendBtn.disabled = true;
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Call Cloudflare worker API
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message })
        });
        
        if (!response.ok) {
            throw new Error('خطا در ارتباط با سرور');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Simulate thinking delay
        await new Promise(resolve => setTimeout(resolve, THINKING_DELAY));
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add bot response with typing animation
        await typeMessage(data.response || 'پاسخی دریافت نشد', 'bot');
        
    } catch (error) {
        hideTypingIndicator();
        addMessage(`خطا: ${error.message}`, 'bot', true);
    } finally {
        chatInput.disabled = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// Show typing indicator
function showTypingIndicator() {
    chatStatus.textContent = 'چت بات در حال تایپ...';
    chatStatus.style.display = 'block';
}

// Hide typing indicator
function hideTypingIndicator() {
    chatStatus.style.display = 'none';
}

// Add message to chat
function addMessage(text, sender, immediate = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('p');
    if (immediate) {
        messageText.textContent = text;
    } else {
        messageText.textContent = '';
    }
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return { messageDiv, messageText };
}

// Type message character by character
async function typeMessage(text, sender) {
    const { messageText } = addMessage('', sender);
    
    for (let i = 0; i < text.length; i++) {
        messageText.textContent = text.substring(0, i + 1);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        await new Promise(resolve => setTimeout(resolve, TYPING_DELAY));
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);