// DOM Elements
const chatBtn = document.querySelector('.chat-btn');
const chatbotContainer = document.querySelector('.chatbot-container');
const backBtn = document.querySelector('.back-btn');
const chatMessages = document.querySelector('.chatbot-messages');
const chatInput = document.getElementById('chatbot-input-field');
const sendBtn = document.getElementById('send-message-btn');
const refreshBtn = document.querySelector('.refresh-chat');
const welcomeScreen = document.querySelector('.welcome-screen');
const suggestionsContainer = document.querySelector('.suggestions-container');
const toggleSuggestionsBtn = document.querySelector('.toggle-suggestions-btn');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');
const featureBtns = document.querySelectorAll('.feature-btn');

// Chat state
let chatHistory = [];
let isTyping = false;
let firstMessageSent = false;

// Initialize chat
function initChat() {
    // Load chat history from localStorage
    const savedChat = localStorage.getItem('borujerdChatHistory');
    if (savedChat) {
        chatHistory = JSON.parse(savedChat);
        firstMessageSent = chatHistory.some(msg => msg.type === 'user');
        renderChatHistory();
    } else {
        // Add welcome message to history if it's a new chat
        chatHistory.push({
            type: 'bot',
            message: 'سلام! 👋 من دستیار هوشمند شهر بروجرد هستم. چطور می‌تونم به شما کمک کنم؟\n\nمی‌تونید درباره جاذبه‌های گردشگری، خدمات شهری، تاریخچه و فرهنگ بروجرد از من سوال بپرسید.',
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
        document.querySelector('#chatbot').classList.add('active');
        document.body.style.overflow = 'hidden';
        scrollToBottom();
    });
    
    // Close chat
    backBtn.addEventListener('click', () => {
        document.querySelector('#chatbot').classList.remove('active');
        document.body.style.overflow = '';
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
    
    // Toggle suggestions
    toggleSuggestionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        suggestionsContainer.classList.toggle('show');
    });
    
    // Suggestion buttons
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            chatInput.focus();
            suggestionsContainer.classList.remove('show');
        });
    });
    
    // Feature buttons
    featureBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chatInput.value = btn.textContent;
            chatInput.focus();
            sendMessage();
        });
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.suggestions-container') && 
            !e.target.closest('.toggle-suggestions-btn') &&
            suggestionsContainer.classList.contains('show')) {
            suggestionsContainer.classList.remove('show');
        }
    });
}

// Send message to chatbot
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '' || isTyping) return;
    
    // Add user message to chat
    addMessage('user', message);
    chatInput.value = '';
    
    // Remove welcome screen if this is the first user message
    if (!firstMessageSent) {
        firstMessageSent = true;
        welcomeScreen.style.display = 'none';
        // Remove welcome message from history
        chatHistory = chatHistory.filter(msg => msg.type !== 'bot' || !msg.message.includes('سلام! 👋'));
        saveChatHistory();
    }
    
    // Show typing indicator
    showTypingIndicator();
    
    // Send to chatbot API
    sendToChatbotAPI(message);
}

// Add message to chat UI
function addMessage(type, message, liked = null) {
    // Add to history
    chatHistory.push({
        type,
        message,
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
    // Store scroll position before rendering
    const wasAtBottom = isScrolledToBottom();
    const prevScrollHeight = chatMessages.scrollHeight;
    const prevScrollTop = chatMessages.scrollTop;
    
    chatMessages.innerHTML = '';
    
    // Show welcome screen if no messages have been sent yet
    if (!firstMessageSent && chatHistory.some(msg => msg.type === 'bot' && msg.message.includes('سلام! 👋'))) {
        welcomeScreen.style.display = 'flex';
        chatMessages.appendChild(welcomeScreen);
    }
    
    chatHistory.forEach((msg, index) => {
        // Skip welcome message if it's already shown separately
        if (msg.type === 'bot' && msg.message.includes('سلام! 👋') && !firstMessageSent) {
            return;
        }
        
        const messageContainer = document.createElement('div');
        messageContainer.className = `message-container ${msg.type}-message-container`;
        
        const messageElement = document.createElement('div');
        messageElement.className = `message ${msg.type}-message`;
        
        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.innerHTML = `<p>${msg.message}</p>`;
        
        messageElement.appendChild(contentElement);
        messageContainer.appendChild(messageElement);
        
        if (msg.type === 'bot' && index > 0) {
            const actionsElement = document.createElement('div');
            actionsElement.className = 'message-actions';
            actionsElement.style.justifyContent = 'flex-start';
            actionsElement.style.marginRight = 'auto';
            actionsElement.style.marginLeft = '0';
            
            const likeBtn = document.createElement('button');
            likeBtn.className = `like-btn ${msg.liked === true ? 'active' : ''}`;
            likeBtn.dataset.index = index;
            likeBtn.innerHTML = '<i class="far fa-thumbs-up"></i>';
            likeBtn.title = 'پاسخ مفید بود';
            
            const dislikeBtn = document.createElement('button');
            dislikeBtn.className = `dislike-btn ${msg.liked === false ? 'active' : ''}`;
            dislikeBtn.dataset.index = index;
            dislikeBtn.innerHTML = '<i class="far fa-thumbs-down"></i>';
            dislikeBtn.title = 'پاسخ مفید نبود';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.dataset.index = index;
            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
            copyBtn.title = 'کپی پاسخ';
            
            actionsElement.appendChild(likeBtn);
            actionsElement.appendChild(dislikeBtn);
            actionsElement.appendChild(copyBtn);
            messageContainer.appendChild(actionsElement);
            
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleFeedback(index, true);
            });
            dislikeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleFeedback(index, false);
            });
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                copyMessage(index);
            });
        }
        
        chatMessages.appendChild(messageContainer);
    });
    
    // Restore scroll position
    if (!wasAtBottom) {
        const newScrollHeight = chatMessages.scrollHeight;
        chatMessages.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
    } else {
        scrollToBottom();
    }
}

function isScrolledToBottom() {
    return chatMessages.scrollHeight - chatMessages.clientHeight <= chatMessages.scrollTop + 10;
}

// Handle feedback (like/dislike)
function handleFeedback(index, isLike) {
    chatHistory[index].liked = isLike;
    saveChatHistory();
    renderChatHistory();
}

// Copy message to clipboard
function copyMessage(index) {
    const message = chatHistory[index].message;
    navigator.clipboard.writeText(message).then(() => {
        const copyBtn = document.querySelector(`.copy-btn[data-index="${index}"]`);
        copyBtn.classList.add('copied');
        setTimeout(() => {
            copyBtn.classList.remove('copied');
        }, 1500);
    });
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
        liked: null
    }];
    firstMessageSent = false;
    saveChatHistory();
    renderChatHistory();
    welcomeScreen.style.display = 'flex';
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