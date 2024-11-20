document.addEventListener("DOMContentLoaded", () => {
  const conversationList = document.getElementById("conversation-list");
  const chatTimeline = document.getElementById("chat-timeline");
  const chatInput = document.querySelector(".chat-footer input");
  const addConversationButton = document.getElementById("add-conversation");
  const topButtons = document.querySelectorAll(".top-buttons button");
  const popup = document.getElementById("popup-new-conversation");
  const newConversationForm = document.getElementById("new-conversation-form");
  const closePopupButton = document.getElementById("close-popup");
  const searchInput = document.getElementById("search-conversations");
  const chatTitle = document.getElementById("chat-title");
  let currentConversationId = null;
  let activeCategory = "bot"; // Categoria ativa padrão

  console.log("Aplicação iniciada.");

  // Função para alternar botões no topo
  function setupTopButtons() {
    topButtons.forEach((button) => {
      button.addEventListener("click", () => {
        topButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        activeCategory = button.id;
        console.log(`Botão ativo: ${activeCategory}`);
        filterConversations(); // Chama a função para filtrar conversas
      });
    });
  }

  // Inicializar IndexedDB
  function initDB() {
    console.log("Inicializando IndexedDB...");
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

  // Carregar mensagens de uma conversa
  function loadMessages(conversationId, callback) {
    console.log(`Carregando mensagens para a conversa: ${conversationId}`);
    initDB().then((db) => {
      const transaction = db.transaction("messages", "readonly");
      const store = transaction.objectStore("messages");
      const index = store.index("conversationId");
      const request = index.getAll(conversationId);

      request.onsuccess = () => {
        console.log(`Mensagens carregadas:`, request.result);
        callback(request.result);
      };

      request.onerror = () => {
        console.error("Erro ao carregar mensagens:", request.error);
      };
    });
  }

  // Atualizar a timeline de mensagens
  function updateTimeline(conversationId) {
    console.log(`Atualizando timeline para a conversa: ${conversationId}`);
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
  conversation.dataset.img = data.img || "./assets/default.jpg"; // Caminho para imagem

  conversationList.appendChild(conversation);

  // Evento de clique para abrir a conversa
  conversation.addEventListener("click", () => {
    currentConversationId = data.id;

    // Atualiza o título da conversa
    if (chatTitle) {
      chatTitle.textContent = data.name;
    }

    console.log(`Conversa selecionada: ${currentConversationId}`);
    updateTimeline(currentConversationId);
  });
}

  // Filtrar conversas pela categoria ativa
  function filterConversations() {
    console.log(`Filtrando conversas pela categoria: ${activeCategory}`);
    initDB().then((db) => {
      const transaction = db.transaction("conversations", "readonly");
      const store = transaction.objectStore("conversations");
      const request = store.getAll();

      request.onsuccess = () => {
        const conversations = request.result;
        conversationList.innerHTML = "";
        conversations
          .filter((conv) => conv.category === activeCategory)
          .forEach((conv) => addConversation(conv));
        console.log("Conversas filtradas e exibidas.");
      };
    });
  }

  // Configurar pesquisa de conversas
  function setupSearch() {
    if (!searchInput) {
      console.error("Campo de busca não encontrado!");
      return;
    }

    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase().trim();
      console.log(`Pesquisando por: "${searchTerm}"`);

      const conversationElements = document.querySelectorAll("conversation-element");

      if (!conversationElements.length) {
        console.warn("Nenhuma conversa para buscar.");
        return;
      }

      conversationElements.forEach((element) => {
        const name = element.dataset.name.toLowerCase();
        if (name.includes(searchTerm)) {
          element.style.display = ""; // Mostra a conversa
        } else {
          element.style.display = "none"; // Esconde a conversa
        }
      });
    });
  }

  // Inicializar funcionalidades
  setupTopButtons();
  setupSearch(); // Configura a pesquisa de conversas
  filterConversations(); // Carrega e filtra conversas inicialmente
});
