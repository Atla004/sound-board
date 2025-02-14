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
    this.loop = false;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationFrame = null;
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
    this.render();
    this.updateCard();
    this.attachListeners();
    this.attachSliderListeners();
    this.attachLoopButtonListener();
  }

  disconnectedCallback() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .card {
          padding: 1rem;
          background: #2d2d2d;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
        }

        .card.playing {
          background: #363636;
          box-shadow: 0 8px 15px rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.5);
        }

        #text {
          font-size: 1.25rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 1rem;
          text-align: center;
          z-index: 1;
        }

        .loop-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
          z-index: 1;
        }

        .loop-button:hover {
          transform: scale(1.1);
        }

        .loop-button svg {
          width: 24px;
          height: 24px;
          fill: #b3b3b3;
          transition: fill 0.2s;
        }

        .loop-button.active svg {
          fill: #6366f1;
        }

        volume-slider {
          width: 100%;
          margin: 1rem 0;
          z-index: 1;
        }

        .visualizer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 60px;
          opacity: 0.5;
        }

      </style>
      <div class="card ${this.state ? "playing" : ""}" id="card">
        <span id="text">${this.text}</span>
        <canvas class="visualizer" id="visualizer"></canvas>
        <volume-slider id="slider"></volume-slider>
        <button class="loop-button ${this.loop ? "active" : ""}" id="loopBtn">
          <svg viewBox="0 0 24 24" class="loop-icon">
            <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
          </svg>
        </button>
      </div>
    `;

    this.visualizer = this.shadowRoot.getElementById("visualizer");
    this.visualizerCtx = this.visualizer.getContext("2d");
  }

  setupAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      const source = this.audioContext.createMediaElementSource(this.audio);
      source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
    }
  }

  drawVisualizer = () => {
    if (!this.state) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      return;
    }

    this.animationFrame = requestAnimationFrame(this.drawVisualizer);
    const width = this.visualizer.width;
    const height = this.visualizer.height;
    const bufferLength = this.analyser.frequencyBinCount;

    this.analyser.getByteFrequencyData(this.dataArray);

    this.visualizerCtx.clearRect(0, 0, width, height);
    const barWidth = (width / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (this.dataArray[i] / 255) * height;
      const gradient = this.visualizerCtx.createLinearGradient(
        0,
        height,
        0,
        height - barHeight
      );
      gradient.addColorStop(0, "#6366f1");
      gradient.addColorStop(1, "#818cf8");

      this.visualizerCtx.fillStyle = gradient;
      this.visualizerCtx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
  };

  updateCard() {
    const card = this.shadowRoot.querySelector("#card");
    const textEl = this.shadowRoot.querySelector("#text");
    if (card) {
      card.className = `card ${this.state ? "playing" : ""}`;
    }
    if (textEl) {
      textEl.textContent = this.text;
    }

    // Update canvas size
    const visualizer = this.shadowRoot.getElementById("visualizer");
    if (visualizer) {
      visualizer.width = visualizer.offsetWidth;
      visualizer.height = visualizer.offsetHeight;
    }
  }

  attachListeners() {
    const card = this.shadowRoot.querySelector("#card");
    if (card) {
      card.addEventListener("click", (e) => {
        if (!e.target.closest(".loop-button")) {
          this.toggleSoundState();
          if (this.songId && this.db) {
            if (!this.audio) {
              this.loadAudioFromDB();
            } else {
              this.updateAudioPlayback();
            }
          }
          this.updateCard();
        }
      });
    }
  }

  attachLoopButtonListener() {
    const loopBtn = this.shadowRoot.querySelector("#loopBtn");
    if (loopBtn) {
      loopBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        this.loop = !this.loop;
        loopBtn.className = `loop-button ${this.loop ? "active" : ""}`;
        if (this.audio) {
          this.audio.loop = this.loop;
        }
      });
    }
  }

  loadAudioFromDB() {
    this.db
      .getSong(Number(this.songId))
      .then((song) => {
        const audioBlob =
          song.data instanceof Blob
            ? song.data
            : new Blob([song.data], { type: "audio/mpeg" });
        const blobUrl = URL.createObjectURL(audioBlob);
        this.audio = new Audio(blobUrl);
        this.audio.loop = this.loop;

        // Set up audio context and visualizer
        this.setupAudioContext();

        if (!this.loop) {
          this.audio.addEventListener("ended", () => {
            this.state = false;
            this.setAttribute("state", this.state);
            this.updateCard();
          });
        }
        if (this.state) {
          this.audio.play().then(() => {
            this.drawVisualizer();
          });
        }
        const slider = this.shadowRoot.querySelector("#slider");
        this.audio.volume = slider.volume;
      })
      .catch((error) => console.error("Error loading song:", error));
  }

  updateAudioPlayback() {
    if (this.state) {
      this.audio.play().then(() => {
        this.drawVisualizer();
      });
    } else {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  attachSliderListeners() {
    const slider = this.shadowRoot.querySelector("#slider");
    if (slider) {
      slider.addEventListener("input", () => {
        if (this.audio) {
          this.audio.volume = slider.volume;
        }
      });
    }
  }

  toggleSoundState() {
    this.state = !this.state;
    this.setAttribute("state", this.state);
  }
}

customElements.define("sound-card", SoundCard);
