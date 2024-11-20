class ConversationElement extends HTMLElement {
  connectedCallback() {
    const { id, name, lastMessage, img } = this.dataset;
    this.innerHTML = `
      <div class="conversation" data-id="${id}">
        <img src="${img}" alt="${name}">
        <div>
          <strong>${name}</strong>
          <p>${lastMessage}</p>
        </div>
      </div>
    `;
  }
}

customElements.define("conversation-element", ConversationElement);
