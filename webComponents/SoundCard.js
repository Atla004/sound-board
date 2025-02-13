import db from "../services/indexdb.js";

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
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "text") {
      this.text = newValue;
    } else if (name === "state") {
      this.state = newValue === "true";
    } else if (name === "song-id") {
      this.songId = newValue;
    }
    this.render();
  }

  connectedCallback() {
    this.render();
    console.log("Sound card connected");
    this.shadowRoot.addEventListener("click", () => {
      console.log("Sound card clicked");
      this.toggleSoundState();
      console.log("State:", this.state);
      console.log("Song ID:", this.songId);
      if (this.songId && this.db) {
        console.log("Song ID and DB available");
        if (!this.audio) {
          this.loadAudioFromDB();
        } else {
          this.updateAudioPlayback();
        }
      }
      this.render();
    });
  }

  toggleSoundState() {
    this.state = !this.state;
    this.setAttribute("state", this.state);
  }

  loadAudioFromDB() {
    this.db.getSong(Number(this.songId))
      .then((song) => {
        // Comprueba si song.data es un Blob. Si no lo es, conviértelo a Blob.
        const audioBlob = song.data instanceof Blob 
          ? song.data
          : new Blob([song.data], { type: "audio/mpeg" });
        const blobUrl = URL.createObjectURL(audioBlob);
        this.audio = new Audio(blobUrl);
        this.audio.loop = true;
        if (this.state) {
          this.audio.play();
        }
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
          background-color: ${this.state ? "lightgreen" : "lightcoral"};
        }
      </style>
      <div class="card">${this.text}</div>
    `;
  }
}

customElements.define("sound-card", SoundCard);