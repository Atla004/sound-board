import db from "../services/indexdb.js";
import "../webComponents/SoundCard.js";

class HomeScreen extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.db = db;
    this.currentplaylist = 1; 
  }

  async loadSongs() {
    let selectedPlaylist = this.currentplaylist;
    const songs = await this.db.getAllSongs(selectedPlaylist);
    this.shadowRoot.innerHTML = `
      <style>
        main {
          display: grid;
          margin-bottom: 10px;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 10px;
          width: 90%;
          padding: 20px;
        }
        sound-card {

        }
      </style>
      <main>
        ${songs
          .map(
            (song) =>
              `<sound-card song-id="${song.id}" text="${song.title}"></sound-card>`
          )
          .join("")}
      </main>
    `;
  }

  stopAllSongs() {
    this.shadowRoot.querySelectorAll("sound-card").forEach((card) => {
      if (card.audio) {
        card.audio.pause();
        card.audio.currentTime = 0;
      }
      // Actualiza el estado para reflejar que no se está reproduciendo (por ejemplo, color rojo)
      card.state = false;
      card.setAttribute("state", "false");
      card.updateCard();
    });
  }

  async connectedCallback() {
    await this.loadSongs();
    document.addEventListener("songs-updated", async () => {
      this.stopAllSongs();
      await this.loadSongs();
    });
    this.addEventListener("playlist-to-reload", async (e) => {
      this.stopAllSongs();
      this.currentplaylist = e.detail.playlistId;
      await this.loadSongs();
    });
  }
}

customElements.define("home-screen", HomeScreen);
