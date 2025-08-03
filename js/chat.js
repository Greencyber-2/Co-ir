// DOM Elements
const chatBtn = document.querySelector('.chat-btn');
const chatbotContainer = document.querySelector('.chatbot-container');
const backBtn = document.querySelector('.back-btn');
const chatMessages = document.querySelector('.chatbot-messages');
const chatInput = document.getElementById('chatbot-input-field');
const sendBtn = document.getElementById('send-message-btn');
const refreshBtn = document.querySelector('.refresh-chat');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');

// Chat state
let chatHistory = [];
let isTyping = false;

// Initialize chat
function initChat() {
    // Load chat history from localStorage
    const savedChat = localStorage.getItem('borujerdChatHistory');
    if (savedChat) {
        chatHistory = JSON.parse(savedChat);
        renderChatHistory();
    } else {
        // Add welcome message to history if it's a new chat
        chatHistory.push({
            type: 'bot',
            message: 'سلام! 👋 من دستیار هوشمند شهر بروجرد هستم. چطور می‌تونم به شما کمک کنم؟\n\nمی‌تونید درباره جاذبه‌های گردشگری، خدمات شهری، تاریخچه و فرهنگ بروجرد از من سوال بپرسید.',
            time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            liked: null
        });
        saveChatHistory();
    }
    
    // Set up event listeners
    setupChatListeners();
}

// Set up event listeners for chat
function setupChatListeners() {
    // Open chat
    chatBtn.addEventListener('click', () => {
        chatbotContainer.classList.add('show');
        document.body.style.overflow = 'hidden';
        scrollToBottom();
    });
    
    // Close chat
    backBtn.addEventListener('click', () => {
        chatbotContainer.classList.remove('show');
        document.body.style.overflow = '';
        // Switch back to home section
        switchSection('home');
        setActiveNavButton(document.querySelector('.nav-btn[data-section="home"]'));
    });
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatInput.value.trim() !== '') {
            sendMessage();
        }
    });
    
    // Send message on button click
    sendBtn.addEventListener('click', () => {
        if (chatInput.value.trim() !== '') {
            sendMessage();
        }
    });
    
    // Refresh chat
    refreshBtn.addEventListener('click', () => {
        if (confirm('آیا مطمئن هستید که می‌خواهید چت را ریست کنید؟ تمام تاریخچه چت پاک خواهد شد.')) {
            resetChat();
        }
    });
    
    // Suggestion buttons
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            chatInput.focus();
        });
    });
}

// Send message to chatbot
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '' || isTyping) return;
    
    // Add user message to chat
    addMessage('user', message);
    chatInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to chatbot API
    sendToChatbotAPI(message);
}

// Add message to chat UI
function addMessage(type, message, liked = null) {
    const timestamp = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    
    // Add to history
    chatHistory.push({
        type,
        message,
        time: timestamp,
        liked
    });
    
    saveChatHistory();
    renderChatHistory();
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    isTyping = true;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'typing-indicator';
    typingElement.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    chatMessages.appendChild(typingElement);
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    isTyping = false;
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Render chat history
function renderChatHistory() {
    chatMessages.innerHTML = '';
    
    chatHistory.forEach((msg, index) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${msg.type}-message`;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.innerHTML = `<p>${msg.message}</p>`;
        
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        timeElement.textContent = msg.time;
        
        messageElement.appendChild(contentElement);
        messageElement.appendChild(timeElement);
        
        if (msg.type === 'bot' && index > 0) {
            const actionsElement = document.createElement('div');
            actionsElement.className = 'message-actions';
            actionsElement.innerHTML = `
                <button class="like-btn" data-index="${index}">
                    <i class="far fa-thumbs-up ${msg.liked === true ? 'liked' : ''}"></i>
                </button>
                <button class="dislike-btn" data-index="${index}">
                    <i class="far fa-thumbs-down ${msg.liked === false ? 'disliked' : ''}"></i>
                </button>
            `;
            messageElement.appendChild(actionsElement);
        }
        
        chatMessages.appendChild(messageElement);
    });
    
    // Set up like/dislike buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFeedback(btn.dataset.index, true));
    });
    
    document.querySelectorAll('.dislike-btn').forEach(btn => {
        btn.addEventListener('click', () => handleFeedback(btn.dataset.index, false));
    });
}

// Handle feedback (like/dislike)
function handleFeedback(index, isLike) {
    chatHistory[index].liked = isLike;
    saveChatHistory();
    renderChatHistory();
}

// Save chat history to localStorage
function saveChatHistory() {
    localStorage.setItem('borujerdChatHistory', JSON.stringify(chatHistory));
}

// Reset chat
function resetChat() {
    chatHistory = [{
        type: 'bot',
        message: 'سلام! 👋 من دستیار هوشمند شهر بروجرد هستم. چطور می‌تونم به شما کمک کنم؟\n\nمی‌تونید درباره جاذبه‌های گردشگری، خدمات شهری، تاریخچه و فرهنگ بروجرد از من سوال بپرسید.',
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        liked: null
    }];
    saveChatHistory();
    renderChatHistory();
}

// Scroll to bottom of chat
function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Send message to chatbot API
async function sendToChatbotAPI(message) {
    try {
        const response = await fetch('https://lively-dream-4d36.dns555104.workers.dev/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
        
        hideTypingIndicator();
        addMessage('bot', data.response);
        
    } catch (error) {
        hideTypingIndicator();
        addMessage('bot', `خطا در دریافت پاسخ: ${error.message}`);
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);