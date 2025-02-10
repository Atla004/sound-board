class CustomButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.label = this.getAttribute("label") || "Click me";
    this.onClick = null;
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.querySelector("button").addEventListener("click", () => {
      if (this.onClick) {
        this.onClick();
      }
    });
  }

  set clickHandler(handler) {
    this.onClick = handler;
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                button {
                    padding: 10px 20px;
                    font-size: 16px;
                    cursor: pointer;
                }
            </style>
            <button>${this.label}</button>
        `;
  }
}

customElements.define("custom-button", CustomButton);
