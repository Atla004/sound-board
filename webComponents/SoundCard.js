class SoundCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = false;
    this.text = this.getAttribute("text") || "";
  }

  static get observedAttributes() {
    return ["text", "state"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "text") {
      this.text = newValue;
    } else if (name === "state") {
      this.state = newValue === "true";
    }
    this.render();
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.addEventListener("click", () => {
      this.state = !this.state;
      this.setAttribute("state", this.state);
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
            <style>
                .card {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 200px;
                    height: 200px;
                    border: 1px solid #000;
                    cursor: pointer;
                    background-color: ${
                      this.state ? "lightgreen" : "lightcoral"
                    };
                }
            </style>
            <div class="card">${this.text}</div>
        `;
  }
}

customElements.define("sound-card", SoundCard);
