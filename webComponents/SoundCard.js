import db from "../services/indexdb.js";
import "../webComponents/Slider.js";

class SoundCard extends HTMLElement {
  static get observedAttributes() {
    return ["text", "state", "song-id"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.state = false;
    this.text = this.getAttribute("text") || "";
    this.songId = this.getAttribute("song-id") || "";
    this.audio = null;
    this.db = db;
    // Nueva propiedad para el loop, por defecto reproducir 1 sola vez
    this.loop = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "text") {
      this.text = newValue;
    } else if (name === "state") {
      this.state = newValue === "true";
    } else if (name === "song-id") {
      this.songId = newValue;
    }
    this.updateCard();
  }

  connectedCallback() {
    this.render(); // Crea la estructura estática una sola vez
    this.updateCard();
    this.attachListeners();       // Listener de click para la tarjeta
    this.attachSliderListeners(); // Listener para el slider (solo una vez)
    this.attachLoopButtonListener(); // Listener para el botón de loop
  }

  render() {
    // Se crea la estructura estática una sola vez, agregando el botón de loop
    this.shadowRoot.innerHTML = `
      <style>
        .card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 200px;
          height: 200px;
          border: 1px solid #000;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        button {
          margin-top: 10px;
        }
      </style>
      <div class="card" id="card">
        <span id="text">${this.text}</span>
        <volume-slider id="slider"></volume-slider>
        <button id="loopBtn">${this.loop ? "Reproducir en loop" : "Reproducir 1 sola vez"}</button>
      </div>
    `;
  }

  updateCard() {
    // Actualiza solo los elementos dinámicos sin recrear la estructura
    const card = this.shadowRoot.querySelector("#card");
    const textEl = this.shadowRoot.querySelector("#text");
    if (card) {
      card.style.backgroundColor = this.state ? "lightgreen" : "lightcoral";
    }
    if (textEl) {
      textEl.textContent = this.text;
    }
  }

  attachListeners() {
    console.log("Sound card connected");
    const card = this.shadowRoot.querySelector("#card");
    if (card) {
      card.addEventListener("click", () => {
        console.log("Sound card clicked");
        this.toggleSoundState();
        if (this.songId && this.db) {
          if (!this.audio) {
            this.loadAudioFromDB();
          } else {
            this.updateAudioPlayback();
          }
        }
        this.updateCard();
      });
    }
  }

  attachSliderListeners() {
    // Se añade el listener al slider solo una vez
    const slider = this.shadowRoot.querySelector("#slider");
    if (slider) {
      slider.addEventListener("input", () => {
        if (this.audio) {
          this.audio.volume = slider.volume;
        }
        console.log("Volume changed to:", slider.volume);
      });
    }
  }

  attachLoopButtonListener() {
    // Se añade el listener al botón de loop solo una vez
    const loopBtn = this.shadowRoot.querySelector("#loopBtn");
    if (loopBtn) {
      loopBtn.addEventListener("click", (event) => {
        event.stopPropagation(); // Para que no se propague al click del card
        this.loop = !this.loop;
        // Actualiza el botón según el estado del loop
        loopBtn.textContent = this.loop ? "Reproducir en loop" : "Reproducir 1 sola vez";
        if (this.audio) {
          this.audio.loop = this.loop;
        }
        console.log("Loop toggled:", this.loop);
      });
    }
  }

  toggleSoundState() {
    this.state = !this.state;
    this.setAttribute("state", this.state);
  }

  loadAudioFromDB() {
    this.db.getSong(Number(this.songId))
      .then((song) => {
        const audioBlob = song.data instanceof Blob
          ? song.data
          : new Blob([song.data], { type: "audio/mpeg" });
        const blobUrl = URL.createObjectURL(audioBlob);
        this.audio = new Audio(blobUrl);
        // Configura el loop según this.loop
        this.audio.loop = this.loop;
        // Si no es loop (1 sola vez), agrega el listener para el fin de la reproducción
        if (!this.loop) {
          this.audio.addEventListener("ended", () => {
            console.log("Audio playback ended");
            // Cambia el estado a no reproducir y actualiza el card (color rojo)
            this.state = false;
            this.setAttribute("state", this.state);
            this.updateCard();
          });
        }
        if (this.state) {
          this.audio.play();
        }
        const slider = this.shadowRoot.querySelector("#slider");
        console.log("Setting volume to:", slider.volume);
        this.audio.volume = slider.volume;
      })
      .catch((error) => console.error("Error loading song:", error));
  }

  updateAudioPlayback() {
    console.log("Updating audio playback");
    if (this.state) {
      this.audio.play();
    } else {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }
}

customElements.define("sound-card", SoundCard);