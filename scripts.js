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
        filterConversations();
      });
    });
  }

  // Função de busca de conversas
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
    conversation.dataset.img = data.img || "./assets/default.jpg"; // Caminho corrigido
    conversationList.appendChild(conversation);

    conversation.addEventListener("click", () => {
      currentConversationId = data.id;

      // Atualiza o título da conversa na barra superior
      if (chatTitle) {
        chatTitle.textContent = data.name;
        console.log(`Título da conversa atualizado: ${data.name}`);
      }

      console.log(`Conversa selecionada: ${currentConversationId}`);
      updateTimeline(currentConversationId);
    });
  }

  // Inicializar funcionalidades
  setupTopButtons();
  filterConversations();
  setupSearch(); // Configura a pesquisa de conversas
});
