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
  const searchInput = document.getElementById("search-conversations");
  const topButtons = document.querySelectorAll(".top-buttons button");
  let currentConversationId = null;
  let activeCategory = "bot"; // Categoria ativa padrão

  // Inicializar IndexedDB
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ChatAppDB", 2);

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

  // Configurar botões superiores para alternar categorias
  function setupTopButtons() {
    topButtons.forEach((button) => {
      button.addEventListener("click", () => {
        topButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        activeCategory = button.id; // Usa o ID do botão como categoria
        console.log(`Categoria ativa: ${activeCategory}`);
        filterConversations();
      });
    });
  }

  // Filtrar conversas com base na categoria ativa
  async function filterConversations() {
    const db = await initDB();
    const transaction = db.transaction("conversations", "readonly");
    const store = transaction.objectStore("conversations");
    const request = store.getAll();

    request.onsuccess = () => {
      const conversations = request.result.filter((conv) => conv.category === activeCategory);
      conversationList.innerHTML = ""; // Limpa a lista antes de carregar
      conversations.forEach(addConversationToDOM);
    };

    request.onerror = () => {
      console.error("Erro ao filtrar conversas:", request.error);
    };
  }

  // Pesquisar conversas pelo nome
  function setupSearch() {
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      const conversationElements = document.querySelectorAll("conversation-element");

      conversationElements.forEach((element) => {
        const name = element.dataset.name.toLowerCase();
        element.style.display = name.includes(searchTerm) ? "" : "none";
      });
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

  // Adicionar conversa ao DOM
  function addConversationToDOM(data) {
    const conversation = document.createElement("conversation-element");
    conversation.dataset.id = data.id;
    conversation.dataset.name = data.name;
    conversation.dataset.lastMessage = data.lastMessage || "Sem mensagens ainda.";
    conversation.dataset.img = data.img || "./assets/default.jpg";
    conversation.dataset.category = data.category || "bot"; // Categoria padrão
    conversationList.appendChild(conversation);

    conversation.addEventListener("click", () => {
      currentConversationId = data.id;
      chatTitle.textContent = data.name;
      loadMessages(currentConversationId);
    });
  }

  // Configurar envio de mensagens
  sendMessageButton.addEventListener("click", () => {
    const content = chatInput.value.trim();
    if (content) {
      sendMessage(content);
      chatInput.value = ""; // Limpar o campo após envio
    }
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
      category: activeCategory, // Define a categoria ativa
    };

    const db = await initDB();
    const transaction = db.transaction("conversations", "readwrite");
    const store = transaction.objectStore("conversations");
    store.add(newConversation);

    // Adicionar conversa ao DOM
    addConversationToDOM(newConversation);

    // Resetar formulário e fechar popup
    newConversationForm.reset();
    popup.classList.add("hidden");
  });

  // Inicializar
  setupTopButtons();
  setupSearch();
  filterConversations(); // Carregar conversas filtradas inicialmente
});
