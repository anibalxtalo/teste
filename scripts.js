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
        filterConversations();
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

  // Salvar conversa no IndexedDB
  function saveConversation(conversation) {
    return initDB().then((db) => {
      const transaction = db.transaction("conversations", "readwrite");
      const store = transaction.objectStore("conversations");
      return store.put(conversation);
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
        conversationList.innerHTML = "";
        conversations
          .filter((conv) => conv.category === activeCategory)
          .forEach((conv) => addConversation(conv));
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

  // Adicionar uma nova conversa
  function addConversation(data) {
    const conversation = document.createElement("conversation-element");
    conversation.dataset.id = data.id;
    conversation.dataset.name = data.name;
    conversation.dataset.lastMessage = data.lastMessage || "Sem mensagens ainda.";
    conversation.dataset.img = data.img || "default.jpg";
    conversationList.appendChild(conversation);

    conversation.addEventListener("click", () => {
      currentConversationId = data.id;
      console.log(`Conversa selecionada: ${currentConversationId}`);
      updateTimeline(currentConversationId);
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

  // Inicializar funcionalidades
  setupTopButtons();
  filterConversations();
  setupSearch(); // Configura a pesquisa de conversas
});
