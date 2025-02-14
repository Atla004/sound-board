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
          .map(song => `<sound-card song-id="${song.id}" text="${song.title}"></sound-card>`)
          .join('')}
      </main>
    `;
  }


  
  stopAllSongs() {
    console.log("Stopping all songs");
    this.shadowRoot.querySelectorAll("sound-card").forEach(card => {
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
    // Escucha el evento personalizado para detener todas las canciones y recargar la lista 
    document.addEventListener("songs-updated", async () => {
      this.stopAllSongs();
      await this.loadSongs();
    });
  }
}

customElements.define("home-screen", HomeScreen);
