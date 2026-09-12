const chatArea = document.getElementById("chatArea");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const typingIndicator = document.getElementById("typingIndicator");
const newChatButton = document.getElementById("newChat");
const historyButton = document.getElementById("historyButton");
const closeHistoryButton = document.getElementById("closeHistory");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const emojiButton = document.getElementById("emojiButton");
const emojiPanel = document.getElementById("emojiPanel");
const voiceButton = document.getElementById("voiceButton");
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || "";

const STORAGE_KEY = "zimal-chat-state";

let conversationHistory = [];
let chats = [];
let activeChatId = "";

let isSending = false;


/*
|--------------------------------------------------------------------------
| Load Saved Conversation
|--------------------------------------------------------------------------
*/

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ chats, activeChatId }));
  } catch (error) {
    console.error("Could not save chat state:", error);
  }
}

function createChat() {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    updatedAt: Date.now()
  };
}

function activeChat() {
  return chats.find(chat => chat.id === activeChatId);
}

function renderHistory() {
  historyList.innerHTML = "";
  if (!chats.length) {
    historyList.innerHTML = `<p class="history-empty">Your chats will appear here once you start talking.</p>`;
    return;
  }

  [...chats].sort((a, b) => b.updatedAt - a.updatedAt).forEach(chat => {
    const item = document.createElement("div");
    item.className = `history-item ${chat.id === activeChatId ? "active" : ""}`;
    item.innerHTML = `
      <button class="history-item-main" type="button">
        <span class="history-title"></span>
        <span class="history-meta"></span>
      </button>
      <button class="delete-history" type="button" aria-label="Delete chat">×</button>
    `;
    item.querySelector(".history-title").textContent = chat.title;
    item.querySelector(".history-meta").textContent =
      `${chat.messages.length} message${chat.messages.length === 1 ? "" : "s"}`;
    item.querySelector(".history-item-main").addEventListener("click", () => switchChat(chat.id));
    item.querySelector(".delete-history").addEventListener("click", event => {
      event.stopPropagation();
      deleteChat(chat.id);
    });
    historyList.appendChild(item);
  });
}

function renderWelcome() {
  chatArea.innerHTML = `
    <div class="welcome-card" id="welcomeCard">
      <div class="welcome-icon">✨</div>
      <p class="eyebrow">your personal chat corner</p>
      <h2>What’s on your mind?</h2>
      <p>Say something. I promise I'm listening 👀</p>
      <div class="suggestions">
        <button class="suggestion">Heyyy 👋</button>
        <button class="suggestion">Tell me something interesting</button>
        <button class="suggestion">What are you doing? 😭</button>
      </div>
    </div>
  `;
  bindSuggestions();
}

function renderChat() {
  chatArea.innerHTML = "";
  if (!conversationHistory.length) {
    renderWelcome();
    return;
  }
  conversationHistory.forEach(message => addMessageToUI(message.role, message.content, false));
  scrollToBottom();
}

function switchChat(chatId) {
  const chat = chats.find(item => item.id === chatId);
  if (!chat) return;
  activeChatId = chat.id;
  conversationHistory = chat.messages;
  renderChat();
  renderHistory();
  historyPanel.classList.add("hidden");
  saveState();
  messageInput.focus();
}

function newChat() {
  const chat = createChat();
  chats.push(chat);
  activeChatId = chat.id;
  conversationHistory = chat.messages;
  renderChat();
  renderHistory();
  saveState();
  messageInput.focus();
}

function deleteChat(chatId) {
  const index = chats.findIndex(chat => chat.id === chatId);
  if (index < 0) return;
  chats.splice(index, 1);
  if (chatId === activeChatId) {
    const nextChat = chats[0] || createChat();
    if (!chats.length) chats.push(nextChat);
    activeChatId = nextChat.id;
    conversationHistory = nextChat.messages;
    renderChat();
  }
  renderHistory();
  saveState();
}

function bindSuggestions() {
  document.querySelectorAll(".suggestion").forEach(button => {
    button.addEventListener("click", () => {
      messageInput.value = button.textContent.trim();
      resizeTextarea();
      messageInput.focus();
    });
  });
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      newChat();
      return;
    }

    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      const migrated = createChat();
      migrated.messages = parsed;
      migrated.title = parsed[0]?.content?.slice(0, 32) || "Previous chat";
      chats = [migrated];
      activeChatId = migrated.id;
    } else {
      chats = Array.isArray(parsed.chats) ? parsed.chats : [];
      activeChatId = parsed.activeChatId;
    }
    if (!chats.length) newChat();
    if (!activeChatId || !chats.some(chat => chat.id === activeChatId)) {
      activeChatId = chats[0].id;
    }
    conversationHistory = activeChat().messages;
    renderChat();
    renderHistory();

  } catch (error) {
    console.error("Could not load conversation:", error);
    chats = [];
    newChat();
  }
}


/*
|--------------------------------------------------------------------------
| Save Conversation
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Add Message
|--------------------------------------------------------------------------
*/

function addMessageToUI(role, content, shouldScroll = true) {

  const row = document.createElement("div");

  row.className = `message-row ${role}`;

  const messageContent = document.createElement("div");

  messageContent.className = "message-content";


  const bubble = document.createElement("div");

  bubble.className = "message-bubble";

  /*
   * textContent is intentional.
   * It prevents AI/user messages from being interpreted as HTML.
   */
  bubble.textContent = content;


  const time = document.createElement("div");

  time.className = "message-time";

  time.textContent = formatTime(new Date());


  messageContent.appendChild(bubble);

  messageContent.appendChild(time);

  row.appendChild(messageContent);

  chatArea.appendChild(row);


  if (shouldScroll) {
    scrollToBottom();
  }
}


/*
|--------------------------------------------------------------------------
| Time
|--------------------------------------------------------------------------
*/

function formatTime(date) {

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

}


/*
|--------------------------------------------------------------------------
| Scroll
|--------------------------------------------------------------------------
*/

function scrollToBottom() {

  requestAnimationFrame(() => {

    chatArea.scrollTo({
      top: chatArea.scrollHeight,
      behavior: "smooth"
    });

  });

}


/*
|--------------------------------------------------------------------------
| Typing Indicator
|--------------------------------------------------------------------------
*/

function showTyping() {

  typingIndicator.classList.remove("hidden");

  scrollToBottom();

}


function hideTyping() {

  typingIndicator.classList.add("hidden");

}


/*
|--------------------------------------------------------------------------
| Auto Resize Textarea
|--------------------------------------------------------------------------
*/

function resizeTextarea() {

  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 130) + "px";

}

messageInput.addEventListener(
  "input",
  resizeTextarea
);

emojiButton.addEventListener("click", () => {
  emojiPanel.classList.toggle("hidden");
  emojiButton.classList.toggle("active");
});

emojiPanel.querySelectorAll("button").forEach(button => {
  button.addEventListener("click", () => {
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    messageInput.value =
      messageInput.value.slice(0, start) +
      button.textContent +
      messageInput.value.slice(end);
    messageInput.selectionStart = messageInput.selectionEnd =
      start + button.textContent.length;
    resizeTextarea();
    messageInput.focus();
  });
});

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onstart = () => voiceButton.classList.add("listening");
  recognition.onend = () => voiceButton.classList.remove("listening");
  recognition.onerror = error => {
    voiceButton.classList.remove("listening");
    console.error("Voice input failed:", error.error);
  };
  recognition.onresult = event => {
    const transcript = event.results[0][0].transcript;
    messageInput.value = `${messageInput.value}${messageInput.value ? " " : ""}${transcript}`;
    resizeTextarea();
    messageInput.focus();
  };
  voiceButton.addEventListener("click", () => recognition.start());
} else {
  voiceButton.title = "Voice input is not supported in this browser";
  voiceButton.addEventListener("click", () => {
    messageInput.placeholder = "Voice input is not supported in this browser";
    messageInput.focus();
  });
}


/*
|--------------------------------------------------------------------------
| Send Message
|--------------------------------------------------------------------------
*/

async function sendMessage(message) {

  if (isSending) {
    return;
  }

  const cleanMessage = message.trim();

  if (!cleanMessage) {
    return;
  }

  isSending = true;

  sendButton.disabled = true;

  messageInput.disabled = true;


  const welcomeCard =
    document.getElementById("welcomeCard");

  if (welcomeCard) {
    welcomeCard.remove();
  }


  /*
   * Add user's message locally first.
   */

  addMessageToUI(
    "user",
    cleanMessage
  );


  conversationHistory.push({
    role: "user",
    content: cleanMessage
  });

  const chat = activeChat();
  chat.messages = conversationHistory;
  if (chat.title === "New chat") chat.title = cleanMessage.slice(0, 32);
  chat.updatedAt = Date.now();
  saveState();
  renderHistory();


  messageInput.value = "";

  resizeTextarea();


  showTyping();


  try {

    const response = await fetch(`${API_BASE_URL}/api/chat`, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: cleanMessage,
        history: conversationHistory.slice(-20)
      })

    });


    const data = await response.json();


    if (!response.ok || !data.success) {
      throw new Error(
        data.error || "Failed to get response."
      );
    }


    const reply = data.reply;


    conversationHistory.push({
      role: "assistant",
      content: reply
    });

    const chat = activeChat();
    chat.messages = conversationHistory;
    chat.updatedAt = Date.now();
    saveState();
    renderHistory();


    hideTyping();

    addMessageToUI(
      "assistant",
      reply
    );


  } catch (error) {

    console.error(error);

    hideTyping();

    addMessageToUI(
      "assistant",
      "Uhh something went wrong 😭 Try sending that again."
    );

  } finally {

    isSending = false;

    sendButton.disabled = false;

    messageInput.disabled = false;

    messageInput.focus();

  }

}


/*
|--------------------------------------------------------------------------
| Form Submit
|--------------------------------------------------------------------------
*/

chatForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    await sendMessage(
      messageInput.value
    );

  }
);


/*
|--------------------------------------------------------------------------
| Enter / Shift + Enter
|--------------------------------------------------------------------------
*/

messageInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      chatForm.requestSubmit();

    }

  }
);


/*
|--------------------------------------------------------------------------
| Suggestion Buttons
|--------------------------------------------------------------------------
*/

bindSuggestions();


/*
|--------------------------------------------------------------------------
| Clear Chat
|--------------------------------------------------------------------------
*/

newChatButton.addEventListener("click", newChat);
historyButton.addEventListener("click", () => {
  renderHistory();
  historyPanel.classList.toggle("hidden");
});
closeHistoryButton.addEventListener("click", () => historyPanel.classList.add("hidden"));


/*
|--------------------------------------------------------------------------
| Initial Load
|--------------------------------------------------------------------------
*/

loadHistory();

messageInput.focus();