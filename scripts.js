document.addEventListener("DOMContentLoaded", () => {
  const conversationList = document.getElementById("conversation-list");
  const chatTimeline = document.getElementById("chat-timeline");
  const chatInput = document.querySelector(".chat-footer input");
  const addConversationButton = document.getElementById("add-conversation");
  const topButtons = document.querySelectorAll(".top-buttons button");
  const popup = document.getElementById("popup-new-conversation");
  const newConversationForm = document.getElementById("new-conversation-form");
  const closePopupButton = document.getElementById("close-popup");
  let currentConversationId = null; // Define inicialmente como nulo
  let activeCategory = "bot"; // Categoria ativa padrão

  // Função para alternar botões no topo
  function setupTopButtons() {
    topButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remover a classe 'active' de todos os botões
        topButtons.forEach((btn) => btn.classList.remove("active"));
        // Adicionar a classe 'active' ao botão clicado
        button.classList.add("active");
        activeCategory = button.id; // Atualizar a categoria ativa
        filterConversations(); // Atualizar a lista de conversas
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
    const conversation = document.createElement("conversation-element");
    conversation.dataset.id = data.id;
    conversation.dataset.name = data.name;
    conversation.dataset.lastMessage = data.lastMessage || "Sem mensagens ainda.";
    conversation.dataset.img = data.img || "default.jpg";
    conversationList.appendChild(conversation);

    conversation.addEventListener("click", () => {
      currentConversationId = data.id; // Atualiza a conversa ativa
      updateTimeline(currentConversationId);
    });
  }

  // Filtrar conversas pela categoria ativa
  function filterConversations() {
    initDB().then((db) => {
      const transaction = db.transaction("conversations", "readonly");
      const store = transaction.objectStore("conversations");
      const request = store.getAll();

      request.onsuccess = () => {
        const conversations = request.result;
        conversationList.innerHTML = ""; // Limpa a lista
        conversations
          .filter((conv) => conv.category === activeCategory) // Filtra pela categoria
          .forEach((conv) => addConversation(conv));
      };
    });
  }

  // Eventos para popup
  addConversationButton.addEventListener("click", () => {
    popup.classList.remove("hidden"); // Exibe o popup
  });

  closePopupButton.addEventListener("click", () => {
    popup.classList.add("hidden"); // Fecha o popup
  });

  newConversationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("conversation-name").value;
    const imageInput = document.getElementById("conversation-image");
    const image = imageInput.files[0] ? URL.createObjectURL(imageInput.files[0]) : "default.jpg";

    const newConversation = {
      id: `conv-${Date.now()}`,
      name,
      img: image,
      category: activeCategory, // Associa à categoria ativa
      lastMessage: "Sem mensagens ainda.",
    };

    await saveConversation(newConversation);
    addConversation(newConversation);
    popup.classList.add("hidden"); // Fecha o popup
  });

  // Evento para envio de mensagens
  if (chatInput) {
    chatInput.addEventListener("keypress", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        if (!currentConversationId) {
          console.error("Nenhuma conversa selecionada.");
          return;
        }

        const message = chatInput.value.trim();
        if (!message) return;

        await saveMessage(currentConversationId, message, "me");
        updateTimeline(currentConversationId);

        chatInput.value = "";

        // Simular resposta automática
        setTimeout(async () => {
          const botResponse = "Obrigado pela sua mensagem!";
          await saveMessage(currentConversationId, botResponse, "bot");
          updateTimeline(currentConversationId);
        }, 1000);
      }
    });
  }

  // Inicializar funcionalidades
  setupTopButtons();
  filterConversations(); // Atualizar conversas exibidas
});
