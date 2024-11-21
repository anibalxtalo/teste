document.addEventListener("DOMContentLoaded", () => {
  const conversationList = document.getElementById("conversation-list");
  const chatTimeline = document.getElementById("chat-timeline");
  const chatInput = document.querySelector(".chat-footer input");
  const sendMessageButton = document.querySelector(".chat-footer button[aria-label='Microfone']");
  const addConversationButton = document.getElementById("add-conversation");
  const popup = document.getElementById("popup-new-conversation");
  const newConversationForm = document.getElementById("new-conversation-form");
  const closePopupButton = document.getElementById("close-popup");
  const chatTitle = document.getElementById("chat-title");
  let currentConversationId = null;

  // Inicializar IndexedDB
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ChatAppDB", 2); // Certifique-se de usar a versão mais alta (2 neste caso)

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("conversations")) {
          db.createObjectStore("conversations", { keyPath: "id", autoIncrement: true });
        }

        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", {
            keyPath: "id",
            autoIncrement: true,
          });
          messageStore.createIndex("conversationId", "conversationId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Exibir e esconder popup
  addConversationButton.addEventListener("click", () => {
    popup.classList.remove("hidden");
  });

  closePopupButton.addEventListener("click", () => {
    popup.classList.add("hidden");
  });

  // Criar nova conversa
  newConversationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("conversation-name").value;
    const imgInput = document.getElementById("conversation-image");
    const img = imgInput.files[0] ? URL.createObjectURL(imgInput.files[0]) : "./assets/default.jpg";

    const newConversation = {
      id: Date.now(),
      name,
      lastMessage: "Sem mensagens ainda.",
      img,
    };

    // Salvar no IndexedDB
    const db = await initDB();
    const transaction = db.transaction("conversations", "readwrite");
    const store = transaction.objectStore("conversations");
    store.add(newConversation);

    // Atualizar a lista de conversas
    addConversationToDOM(newConversation);

    // Resetar o formulário e fechar o popup
    newConversationForm.reset();
    popup.classList.add("hidden");
  });

  // Carregar conversas do IndexedDB
  async function loadConversations() {
    const db = await initDB();
    const transaction = db.transaction("conversations", "readonly");
    const store = transaction.objectStore("conversations");
    const request = store.getAll();

    request.onsuccess = () => {
      const conversations = request.result;
      conversationList.innerHTML = ""; // Limpar lista antes de carregar
      conversations.forEach(addConversationToDOM);
    };

    request.onerror = () => {
      console.error("Erro ao carregar conversas:", request.error);
    };
  }

  // Adicionar conversa ao DOM
  function addConversationToDOM(data) {
    const conversation = document.createElement("conversation-element");
    conversation.dataset.id = data.id;
    conversation.dataset.name = data.name;
    conversation.dataset.lastMessage = data.lastMessage || "Sem mensagens ainda.";
    conversation.dataset.img = data.img || "./assets/default.jpg";
    conversationList.appendChild(conversation);

    conversation.addEventListener("click", () => {
      currentConversationId = data.id;
      chatTitle.textContent = data.name;
      loadMessages(currentConversationId);
    });
  }

  // Enviar mensagem
  async function sendMessage(content) {
    if (!currentConversationId) {
      console.error("Nenhuma conversa selecionada!");
      return;
    }

    const db = await initDB();
    const transaction = db.transaction("messages", "readwrite");
    const store = transaction.objectStore("messages");
    const message = {
      conversationId: currentConversationId,
      message: content,
      sender: "me",
      timestamp: new Date().toISOString(),
    };

    store.add(message);

    // Atualizar timeline visualmente
    addMessageToTimeline(message);
  }

  // Adicionar mensagem à timeline
  function addMessageToTimeline(message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${message.sender === "me" ? "sent" : "received"}`;
    messageDiv.innerHTML = `
      <p>${message.message}</p>
      <small>${new Date(message.timestamp).toLocaleTimeString()}</small>
    `;
    chatTimeline.appendChild(messageDiv);
    chatTimeline.scrollTop = chatTimeline.scrollHeight;
  }

  // Carregar mensagens de uma conversa
  async function loadMessages(conversationId) {
    const db = await initDB();
    const transaction = db.transaction("messages", "readonly");
    const store = transaction.objectStore("messages");
    const index = store.index("conversationId");
    const request = index.getAll(conversationId);

    request.onsuccess = () => {
      const messages = request.result;
      chatTimeline.innerHTML = ""; // Limpar antes de exibir
      messages.forEach(addMessageToTimeline);
    };

    request.onerror = () => {
      console.error("Erro ao carregar mensagens:", request.error);
    };
  }

  // Configurar envio de mensagens
  sendMessageButton.addEventListener("click", () => {
    const content = chatInput.value.trim();
    if (content) {
      sendMessage(content);
      chatInput.value = "";
    }
  });

  // Inicializar
  loadConversations();
});
