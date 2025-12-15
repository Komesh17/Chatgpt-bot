// const chatLog = document.getElementById('chat-log'),
//     userInput = document.getElementById('user-input'),
//     sendButton = document.getElementById('send-button'),
//     buttonIcon = document.getElementById('button-icon'),
//     info = document.querySelector('.info');

// sendButton.addEventListener('click', sendMessage);
// userInput.addEventListener('keydown', (event) => {
//     if (event.key === 'Enter') {
//         sendMessage();
//     }
// });

// function sendMessage() {
//     const message = userInput.value.trim();
//     if (message === '') return;

//     if (message === 'developer') {
//         userInput.value = '';
//         appendMessage('user', message);
//         setTimeout(() => {
//             appendMessage('bot', 'This Source Coded By Reza Mehdikhanlou \nYoutube : @AsmrProg');
//             buttonIcon.classList.add('fa-solid', 'fa-paper-plane');
//             buttonIcon.classList.remove('fas', 'fa-spinner', 'fa-pulse');
//         }, 2000);
//         return;
//     }

//     appendMessage('user', message);
//     userInput.value = '';

//     // Show loading spinner
//     buttonIcon.classList.remove('fa-solid', 'fa-paper-plane');
//     buttonIcon.classList.add('fas', 'fa-spinner', 'fa-pulse');

//     const url = 'https://chatgpt-42.p.rapidapi.com/conversationgpt4';
//     const options = {
//         method: 'POST',
//         headers: {
//             'x-rapidapi-key': '1c36cdcc46mshf12855a5c0f542dp148cc9jsn0e7b01c27033',
//             'x-rapidapi-host': 'chatgpt-42.p.rapidapi.com',
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             messages: [
//                 {
//                     role: 'user',
//                     content: message
//                 }
//             ],
//             system_prompt: '',
//             temperature: 0.9,
//             top_k: 5,
//             top_p: 0.9,
//             max_tokens: 256,
//             web_access: false
//         })
//     };

//     fetch(url, options)
//         .then((response) => response.json())
//         .then((response) => {
//             console.log(response);
//             if (response.result) {
//                 appendMessage('bot', response.result);
//             } else if (response.choices && response.choices[0] && response.choices[0].message) {
//                 appendMessage('bot', response.choices[0].message.content);
//             } else if (response.message) {
//                 appendMessage('bot', response.message);
//             } else if (response.status === false) {
//                 appendMessage('bot', 'API Error: status false. Check your endpoint, body, or API key.');
//             } else {
//                 appendMessage('bot', 'Error: Unexpected API response. See console for details.');
//             }
//             buttonIcon.classList.add('fa-solid', 'fa-paper-plane');
//             buttonIcon.classList.remove('fas', 'fa-spinner', 'fa-pulse');
//         })
//         .catch((err) => {
//             console.error(err);
//             appendMessage('bot', 'Error: Network/API problem. Check your API Key, endpoint, or network connection!');
//             buttonIcon.classList.add('fa-solid', 'fa-paper-plane');
//             buttonIcon.classList.remove('fas', 'fa-spinner', 'fa-pulse');
//         });
// }

// function appendMessage(sender, message) {
//     info.style.display = "none";
//     // change send button icon to loading using fontawesome
//     buttonIcon.classList.remove('fa-solid', 'fa-paper-plane');
//     buttonIcon.classList.add('fas', 'fa-spinner', 'fa-pulse');

//     const messageElement = document.createElement('div');
//     const iconElement = document.createElement('div');
//     const chatElement = document.createElement('div');
//     const icon = document.createElement('i');

//     chatElement.classList.add("chat-box");
//     iconElement.classList.add("icon");
//     messageElement.classList.add(sender);
//     messageElement.innerText = message;

//     if (sender === 'user') {
//         icon.classList.add('fa-regular', 'fa-user');
//         iconElement.setAttribute('id', 'user-icon');
//     } else {
//         icon.classList.add('fa-solid', 'fa-robot');
//         iconElement.setAttribute('id', 'bot-icon');
//     }

//     iconElement.appendChild(icon);
//     chatElement.appendChild(iconElement);
//     chatElement.appendChild(messageElement);
//     chatLog.appendChild(chatElement);
//     chatLog.scrollTop = chatLog.scrollHeight; // FIXED
// }

const chatLog = document.getElementById('chat-log'),
    userInput = document.getElementById('user-input'),
    sendButton = document.getElementById('send-button'),
    buttonIcon = document.getElementById('button-icon'),
    info = document.querySelector('.info');

// State management
let isProcessing = false;
const responseCache = new Map();
const MAX_CACHE_SIZE = 20;

// Event Listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !isProcessing) sendMessage();
});

async function sendMessage() {
    if (isProcessing) return;
    const message = userInput.value.trim();
    if (!message) return;

    // Cache check
    if (responseCache.has(message)) {
        appendMessage('user', message);
        appendMessage('bot', responseCache.get(message), true);
        userInput.value = '';
        return;
    }

    // UI optimizations
    toggleProcessingState(true);
    appendMessage('user', message);
    const tempMessageId = appendBotPlaceholder();
    userInput.value = '';

    // API call
    try {
        const response = await fetchResponse(message);
        updateBotResponse(tempMessageId, response);
        cacheResponse(message, response);
    } catch (error) {
        handleApiError(error, message);
    } finally {
        toggleProcessingState(false);
    }
}

// API Functions
async function fetchResponse(message) {
    const options = {
        method: 'POST',
        headers: {
            'X-RapidAPI-Key': '1c36cdcc46mshf12855a5c0f542dp148cc9jsn0e7b01c27033',
            'X-RapidAPI-Host': 'chatgpt-42.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [{ role: 'user', content: message }],
            max_tokens: 150 // Reduced from 256
        })
    };

    const response = await fetch('https://chatgpt-42.p.rapidapi.com/conversationgpt4', options);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.result || data.choices?.[0]?.message?.content || "I'm having trouble responding right now.";
}

// UI Functions
function appendBotPlaceholder() {
    const id = `temp-${Date.now()}`;
    const placeholder = `
        <div class="chat-box bot temp-message" id="${id}">
            <i class="fa-solid fa-robot"></i>
            <div class="typing-indicator">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatLog.insertAdjacentHTML('beforeend', placeholder);
    chatLog.scrollTop = chatLog.scrollHeight;
    return id;
}

function updateBotResponse(id, message) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('temp-message');
        element.querySelector('.typing-indicator').outerHTML = 
            `<div class="message">${message}</div>`;
    }
}

function appendMessage(sender, message, isCached = false) {
    const cachedBadge = isCached ? '<span class="cached-badge">(cached)</span>' : '';
    const messageHTML = `
        <div class="chat-box ${sender}">
            <i class="${sender === 'user' ? 'fa-regular fa-user' : 'fa-solid fa-robot'}"></i>
            <div class="message">${message}${cachedBadge}</div>
        </div>
    `;
    chatLog.insertAdjacentHTML('beforeend', messageHTML);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Cache Management
function cacheResponse(question, answer) {
    if (responseCache.size >= MAX_CACHE_SIZE) {
        responseCache.delete([...responseCache.keys()][0]);
    }
    responseCache.set(question, answer);
}

// State Management
function toggleProcessingState(isProcessing) {
    sendButton.disabled = isProcessing;
    userInput.disabled = isProcessing;
    buttonIcon.className = isProcessing 
        ? 'fas fa-spinner fa-pulse' 
        : 'fa-solid fa-paper-plane';
}

// Error Handling
function handleApiError(error, message) {
    console.error('API Error:', error);
    const errorHTML = `
        <div class="chat-box bot error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <div class="message">
                ${error.message}
                <button class="retry-btn" onclick="retryLastMessage()">Retry</button>
            </div>
        </div>
    `;
    chatLog.insertAdjacentHTML('beforeend', errorHTML);
}

function retryLastMessage() {
    const lastMessage = [...document.querySelectorAll('.chat-box.user')].pop()?.textContent;
    if (lastMessage) sendMessage(lastMessage);
}