// DOM Elements
const chatInput = document.getElementById('chat-input');
const sendBtn = document.querySelector('.send-btn');
const chatMessages = document.querySelector('.chat-messages');
const chatContainer = document.querySelector('.chat-container');
const closeChatBtn = document.querySelector('.close-chat');
const chatBtn = document.querySelector('.nav-btn[data-section="chatbot"]');

// Sample bot responses
const botResponses = [
    "بروجرد شهری تاریخی در استان لرستان است که به پاریس کوچولو معروف است.",
    "مسجد جامع بروجرد یکی از قدیمی‌ترین مساجد ایران است.",
    "برای اطلاعات بیشتر درباره جاذبه‌های گردشگری می‌توانید به بخش گردشگری مراجعه کنید.",
    "سازمان فاوا بروجرد مسئول توسعه خدمات دیجیتال در شهر است.",
    "پارک شیرین‌پور بزرگترین پارک شهر بروجرد است.",
    "بازار قدیم بروجرد مرکز خرید سنتی و صنایع دستی است.",
    "بروجرد دارای آب و هوای معتدل کوهستانی است.",
    "صنایع دستی بروجرد شامل ورشوسازی، قالی‌بافی و گلیم‌بافی است.",
    "غذاهای محلی بروجرد شامل آش ترخینه، کله جوش و آش کارده هستند.",
    "بروجرد به شهر بناهای تاریخی معروف است."
];

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

// Send message
function sendMessage() {
    const message = chatInput.value.trim();
    if (message === '') return;
    
    // Add user message (right aligned)
    addMessage(message, 'user');
    chatInput.value = '';
    
    // Simulate bot typing
    setTimeout(() => {
        const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
        addMessage(randomResponse, 'bot');
    }, 1000);
}

// Add message to chat
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('p');
    messageText.textContent = text;
    
    messageContent.appendChild(messageText);
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', initChat);