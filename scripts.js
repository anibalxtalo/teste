document.addEventListener("DOMContentLoaded", () => {
  const conversationList = document.getElementById("conversation-list");
  const chatTimeline = document.getElementById("chat-timeline");
  const chatInput = document.querySelector(".chat-footer input");
  const addConversationButton = document.getElementById("add-conversation"); // Declarado apenas aqui
  const topButtons = document.querySelectorAll(".top-buttons button");
  let currentConversationId = "default";

  // Função para alternar botões no topo
  function setupTopButtons() {
    topButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remover a classe 'active' de todos os botões
        topButtons.forEach((btn) => btn.classList.remove("active"));
        // Adicionar a classe 'active' ao botão clicado
        button.classList.add("active");
        console.log(`Botão '${button.id}' clicado`);
      });
    });
  }

  // Inicializar IndexedDB
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ChatAppDB", 2);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("messages")) {
          const messageStore = db.createObjectStore("messages", {
            keyPath: "id",
            autoIncrement: true,
          });
          messageStore.createIndex("conversationId", "conversationId", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("conversations")) {
          db.createObjectStore("conversations", { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Salvar mensagens no IndexedDB
  function saveMessage(conversationId, message, sender) {
    return initDB().then((db) => {
      const transaction = db.transaction("messages", "readwrite");
      const store = transaction.objectStore("messages");
      const timestamp = new Date().toISOString();
      return store.add({ conversationId, message, sender, timestamp });
    });
  }

  // Salvar conversa no IndexedDB
  function saveConversation(conversation) {
    return initDB().then((db) => {
      const transaction = db.transaction("conversations", "readwrite");
      const store = transaction.objectStore("conversations");
      return store.put(conversation);
    });
  }

  // Carregar mensagens de uma conversa
  function loadMessages(conversationId, callback) {
    initDB().then((db) => {
      const transaction = db.transaction("messages", "readonly");
      const store = transaction.objectStore("messages");
      const index = store.index("conversationId");
      const request = index.getAll(conversationId);

      request.onsuccess = () => callback(request.result);
    });
  }

  // Atualizar a timeline de mensagens
  function updateTimeline(conversationId) {
    loadMessages(conversationId, (messages) => {
      if (!messages || messages.length === 0) {
        chatTimeline.innerHTML = "<p>Sem mensagens nesta conversa.</p>";
      } else {
        chatTimeline.innerHTML = messages
          .map(
            (msg) =>
              `<div class="message ${msg.sender === "me" ? "sent" : "received"}">
                <p>${msg.message}</p>
                <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
              </div>`
          )
          .join("");
        chatTimeline.scrollTop = chatTimeline.scrollHeight;
      }
    });
  }

  // Adicionar uma nova conversa
  function addConversation(data) {
    const conversation = document.createElement("div");
    conversation.classList.add("conversation");
    conversation.dataset.id = data.id;
    conversation.innerHTML = `
      <strong>${data.name}</strong>
      <p>${data.lastMessage || "Sem mensagens ainda."}</p>
    `;
    conversationList.appendChild(conversation);

    conversation.addEventListener("click", () => {
      currentConversationId = data.id;
      updateTimeline(currentConversationId);
    });

    saveConversation(data);
  }

  // Carregar conversas salvas
  function loadConversations() {
    initDB().then((db) => {
      const transaction = db.transaction("conversations", "readonly");
      const store = transaction.objectStore("conversations");
      const request = store.getAll();

      request.onsuccess = () => {
        const conversations = request.result;
        conversations.forEach((conv) => addConversation(conv));
      };
    });
  }

  // Configurar eventos
  if (addConversationButton) {
    addConversationButton.addEventListener("click", () => {
      const id = `conv${Date.now()}`;
      addConversation({
        id,
        name: `Nova Conversa ${id}`,
        lastMessage: "Sem mensagens ainda.",
      });
    });
  } else {
    console.error("O botão 'add-conversation' não foi encontrado.");
  }

  if (chatInput) {
    chatInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
          saveMessage(currentConversationId, message, "me").then(() => {
            updateTimeline(currentConversationId);
          });
          chatInput.value = "";

          // Simular resposta automática do bot
          setTimeout(() => {
            const botResponse = "Obrigado pela sua mensagem!";
            saveMessage(currentConversationId, botResponse, "bot").then(() => {
              updateTimeline(currentConversationId);
            });
          }, 1000);
        }
      }
    });
  }

  // Inicializar funcionalidades
  setupTopButtons();
  loadConversations();
  updateTimeline(currentConversationId);
});
