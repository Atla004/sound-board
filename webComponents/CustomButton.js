class CustomButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.label = this.getAttribute("label") || "Click me";
    this.onClick = null;
    this.disabled = this.hasAttribute("disabled");
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.querySelector("button").addEventListener("click", () => {
      if (this.onClick && !this.disabled) {
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
          background: #2d2d2d;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          background: #363636;
          border-color: rgba(99, 102, 241, 0.5);
        }

        button:active {
          transform: translateY(0);
          background: #404040;
        }

        button:disabled {
          background: #555555;
          cursor: not-allowed;
          box-shadow: none;
        }

        @media (max-width: 768px) {
          button {
            padding: 10px 20px;
            font-size: 14px;
          }
        }
      </style>
      <button ${this.disabled ? "disabled" : ""}>${this.label}</button>
    `;
  }
}

customElements.define("custom-button", CustomButton);
