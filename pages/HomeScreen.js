// filepath: /c:/Users/andre/Documents/VisualStudio/Uru/Vanila/sound-board/pages/HomeScreen.js
import db from "../services/indexdb.js";
import "../webComponents/SoundCard.js";

class HomeScreen extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.db = db;
  }

  async loadSongs() {
    const songs = await this.db.getAllSongs();
    this.shadowRoot.innerHTML = `
      <style>
        main {
          padding: 10px;
        }
        sound-card {
          display: block;
          margin-bottom: 10px;
        }
      </style>
      <main>
        ${songs
          .map(song => `<sound-card song-id="${song.id}" text="${song.title}"></sound-card>`)
          .join('')}
      </main>
    `;
  }

  async connectedCallback() {
    await this.loadSongs();
    // Escucha el evento personalizado para recargar las canciones
    document.addEventListener("songs-updated", () => this.loadSongs());
  }
}

customElements.define("home-screen", HomeScreen);