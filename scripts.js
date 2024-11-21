document.addEventListener("DOMContentLoaded", () => {
  const conversationList = document.getElementById("conversation-list");
  const chatTimeline = document.getElementById("chat-timeline");
  const addConversationButton = document.getElementById("add-conversation");
  const popup = document.getElementById("popup-new-conversation");
  const newConversationForm = document.getElementById("new-conversation-form");
  const closePopupButton = document.getElementById("close-popup");
  const chatTitle = document.getElementById("chat-title");
  let currentConversationId = null;

  console.log("Aplicação iniciada.");

  // Inicializar IndexedDB
  function initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("ChatAppDB", 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains("conversations")) {
          db.createObjectStore("conversations", { keyPath: "id", autoIncrement: true });
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

  // Adicionar conversa ao IndexedDB e à lista visual
  newConversationForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("conversation-name").value;
    const imgInput = document.getElementById("conversation-image");
    const img = imgInput.files[0] ? URL.createObjectURL(imgInput.files[0]) : "./assets/default.jpg";

    const newConversation = {
      id: Date.now(), // Gera um ID único temporário
      name,
      lastMessage: "Sem mensagens ainda.",
      img,
    };

    // Salvar no IndexedDB
    const db = await initDB();
    const transaction = db.transaction("conversations", "readwrite");
    const store = transaction.objectStore("conversations");
    store.add(newConversation);

    // Atualizar a lista visual
    addConversationToDOM(newConversation);

    // Fechar popup e resetar formulário
    newConversationForm.reset();
    popup.classList.add("hidden");
  });

  // Atualizar a lista visual
  function addConversationToDOM(data) {
    const conversation = document.createElement("conversation-element");
    conversation.dataset.id = data.id;
    conversation.dataset.name = data.name;
    conversation.dataset.lastMessage = data.lastMessage;
    conversation.dataset.img = data.img;
    conversationList.appendChild(conversation);

    conversation.addEventListener("click", () => {
      currentConversationId = data.id;
      chatTitle.textContent = data.name;
      console.log(`Conversa selecionada: ${data.name}`);
    });
  }

  // Carregar conversas do IndexedDB
  async function loadConversations() {
    const db = await initDB();
    const transaction = db.transaction("conversations", "readonly");
    const store = transaction.objectStore("conversations");
    const request = store.getAll();

    request.onsuccess = () => {
      const conversations = request.result;
      conversations.forEach(addConversationToDOM);
    };

    request.onerror = () => {
      console.error("Erro ao carregar conversas:", request.error);
    };
  }

  // Inicializar aplicação
  loadConversations();
});
