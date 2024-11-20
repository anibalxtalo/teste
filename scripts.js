document.addEventListener("DOMContentLoaded", () => {
  const conversationList = document.getElementById("conversation-list");
  const addConversationButton = document.getElementById("add-conversation");
  const topButtons = document.querySelectorAll(".top-buttons button");
  const popup = document.getElementById("popup-new-conversation");
  const newConversationForm = document.getElementById("new-conversation-form");
  const closePopupButton = document.getElementById("close-popup");
  let activeCategory = "bot"; // Categoria padrão associada ao botão "Bot"

  // Abrir popup ao clicar no botão "Adicionar Conversa"
  addConversationButton.addEventListener("click", () => {
    popup.classList.remove("hidden");
  });

  // Fechar popup
  closePopupButton.addEventListener("click", () => {
    popup.classList.add("hidden");
  });

  // Trocar categoria ativa ao clicar em um botão superior
  topButtons.forEach((button) => {
    button.addEventListener("click", () => {
      topButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      activeCategory = button.id; // Salva a categoria ativa
      filterConversations(); // Atualiza as conversas exibidas
    });
  });

  // Enviar formulário para criar uma nova conversa
  newConversationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = document.getElementById("conversation-name").value;
    const imageInput = document.getElementById("conversation-image");
    const image = imageInput.files[0] ? URL.createObjectURL(imageInput.files[0]) : "default.jpg";

    const newConversation = {
      id: `conv-${Date.now()}`,
      name,
      img: image,
      category: activeCategory, // Categoria associada
      lastMessage: "Sem mensagens ainda."
    };

    await saveConversation(newConversation);
    popup.classList.add("hidden");
    addConversation(newConversation);
  });

  // Salvar conversa no IndexedDB
  function saveConversation(conversation) {
    return initDB().then((db) => {
      const transaction = db.transaction("conversations", "readwrite");
      const store = transaction.objectStore("conversations");
      return store.put(conversation);
    });
  }

  // Adicionar uma conversa ao DOM
  function addConversation(data) {
    const conversation = document.createElement("conversation-element");
    conversation.dataset.id = data.id;
    conversation.dataset.name = data.name;
    conversation.dataset.lastMessage = data.lastMessage;
    conversation.dataset.img = data.img;
    conversationList.appendChild(conversation);
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

  // Inicializar IndexedDB
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ChatAppDB", 2);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("conversations")) {
          const store = db.createObjectStore("conversations", { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = (error) => reject(error);
    });
  }

  // Inicialização
  filterConversations();
});
