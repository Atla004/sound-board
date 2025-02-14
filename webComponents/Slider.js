class Slider extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        .slider-container {
          width: 100%;
          padding: 10px;
        }

        .slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: #e9ecef;
          outline: none;
          transition: background 0.2s;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3498db;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 50%;
          background: #3498db;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .slider::-webkit-slider-thumb:hover,
        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
        }

        .slider::-webkit-slider-runnable-track,
        .slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
        }

        .slider:focus {
          outline: none;
        }

        .slider:active::-webkit-slider-thumb {
          transform: scale(1.2);
        }

        .slider:active::-moz-range-thumb {
          transform: scale(1.2);
        }
      </style>
      <div class="slider-container">
        <input type="range" min="0" max="1" step="0.01" value="1" class="slider" id="volumeSlider">
      </div>
    `;
  }

  connectedCallback() {
    const slider = this.shadowRoot.getElementById("volumeSlider");
    slider.addEventListener("input", (event) => {
      this.volume = event.target.value;
    });
    slider.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  get volume() {
    return this.shadowRoot.getElementById("volumeSlider").value;
  }

  set volume(value) {
    this.shadowRoot.getElementById("volumeSlider").value = value;
  }
}

customElements.define("volume-slider", Slider);