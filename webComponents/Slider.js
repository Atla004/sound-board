class Slider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        .slider {
          width: 100%;
          margin: 10px 0;
        }
      </style>
      <input type="range" min="0" max="1" step="0.01" value="1" class="slider" id="volumeSlider">
    `;
    console.log("Slider created");  
  }

  connectedCallback() {
    const slider = this.shadowRoot.getElementById("volumeSlider");
    slider.addEventListener("input", (event) => {
      this.volume = event.target.value;
    });
    slider.addEventListener("click", (event) => {
      event.stopPropagation(); // Detiene la propagación del evento de clic
    });
    console.log("Slider connected");
  }

  // Propiedad pública para obtener el volumen actual
  get volume() {
    return this.shadowRoot.getElementById("volumeSlider").value;
  }

  // Propiedad pública para establecer el volumen actual
  set volume(value) {
    this.shadowRoot.getElementById("volumeSlider").value = value;
  }
}

customElements.define("volume-slider", Slider);