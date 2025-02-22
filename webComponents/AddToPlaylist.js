import db from "../services/indexdb.js";

class AddToPlaylist extends HTMLElement {
  constructor() {
    super();
    this.db = db;
    this.attachShadow({ mode: "open" });
    this.playlistId = 1;
    this.songs = []; // variable para almacenar canciones
    this.shadowRoot.innerHTML = `
      <style>
        /* Hacer que todo el texto sea negro */
        * {
          color: #000;
        }
        /* Botón de la cruz */
        .open-button {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
        }
        /* Modal styling */
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: none;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.5);
          z-index: 200;
        }
        .modal.active {
          display: flex;
        }
        .modal-content {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          max-height: 80%;
          overflow-y: auto;
          min-width: 300px;
        }
        .song-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #ccc;
        }
        .song-name {
          flex-grow: 1;
        }
        .icon-buttons {
          /* Corrigiendo etiqueta; se cierra la etiqueta div correctamente */
        }
        .icon-buttons button {
          margin-left: 8px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
        }
        .icon-buttons button.add {
          color: #000;
        }
      </style>
      <button class="open-button" id="openModal">✚</button>
      <div class="modal" id="modal">
        <div class="modal-content">
          <h2 id="playlistTitle">Agregar a la Playlist</h2>
          <input id="searchInput" type="text" placeholder="Buscar..." />
          <!-- Lista de canciones se generará dinámicamente -->
          <div id="songList"></div>
          <button id="closeModal">Cerrar</button>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    console.log("Elemento añadido al DOM");
    this.shadowRoot
      .getElementById("openModal")
      .addEventListener("click", () => this.openModal());
    this.shadowRoot
      .getElementById("closeModal")
      .addEventListener("click", () => this.closeModal());

    this.addEventListener("playlist-to-reload", async (e) => {
      this.playlistId = e.detail.playlistId;
      this.updateVisibility();
      if (this.playlistId !== 1) {
        console.log("playlist:", this.playlistId);
        await this.loadSongs();
      }
    });

    this.shadowRoot
      .getElementById("searchInput")
      .addEventListener("input", () => this.displaySongs());
    this.updateVisibility();
  }

  updateVisibility() {
    // Hide the component if playlistId is 1
    this.style.display = this.playlistId === 1 ? "none" : "";
  }

  async loadSongs() {
    const songs = await this.db.getAllSongs(1); // Usando playlist "1" como ejemplo
    this.songs = songs; // almacenar canciones
    this.displaySongs();
  }

  displaySongs() {
    const query = this.shadowRoot
      .getElementById("searchInput")
      .value.toLowerCase();
    const filteredSongs = this.songs.filter((song) =>
      song.title.toLowerCase().includes(query)
    );
    const container = this.shadowRoot.getElementById("songList");
    container.innerHTML = filteredSongs
      .map(
        (song) => `
      <div class="song-card">
        <span class="song-name">${song.title}</span>
        <div class="icon-buttons">
          <button class="add" data-song-id="${song.id}">＋</button>
          <button class="remove" data-song-id="${song.id}">×</button>
        </div>
      </div>
    `
      )
      .join("");
    // Agregar listeners a cada botón tras renderizar el contenido
    container.querySelectorAll("button.add").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        this.onAdd(event.target.dataset.songId);
      });
    });
    container.querySelectorAll("button.remove").forEach((btn) => {
      btn.addEventListener("click", (event) => {
        this.onRemove(event.target.dataset.songId);
      });
    });
  }

  async onAdd(songId) {
    try {
      const playlist = await this.db.getPlaylist(this.playlistId);
      // Asegurarse de que el id no esté ya en la playlist
      if (playlist && !playlist.playlist.includes(Number(songId))) {
        playlist.playlist.push(Number(songId));
        await this.db.updatePlaylist(playlist);
        console.log("Canción agregada a la playlist:", songId);
      } else {
        console.log(
          "La canción ya está en la playlist o no se encontró la playlist."
        );
      }
      this.dispatchEvent(
        new CustomEvent("edit-playlist", {
          detail: { playlistId: this.playlistId },
        })
      );
    } catch (error) {
      console.error("Error al agregar la canción:", error);
    }
  }

  async onRemove(songId) {
    try {
      const playlist = await this.db.getPlaylist(this.playlistId);
      if (playlist) {
        playlist.playlist = playlist.playlist.filter(
          (id) => id !== Number(songId)
        );
        await this.db.updatePlaylist(playlist);
        console.log("Canción removida de la playlist:", songId);
      } else {
        console.log("Playlist no encontrada.");
      }
      this.dispatchEvent(
        new CustomEvent("edit-playlist", {
          detail: { playlistId: this.playlistId },
        })
      );
    } catch (error) {
      console.error("Error al remover la canción:", error);
    }
  }

  async openModal() {
    await this.loadSongs();
    // Actualizar título de modal con el nombre de la playlist
    const playlist = await this.db.getPlaylist(this.playlistId);
    const titleElement = this.shadowRoot.getElementById("playlistTitle");
    titleElement.textContent =
      playlist && playlist.name
        ? `Agregar a la Playlist: ${playlist.name}`
        : "Agregar a la Playlist";
    this.shadowRoot.getElementById("modal").classList.add("active");
    console.log("Modal abierto con id de playlist:", this.playlistId);
  }

  closeModal() {
    this.shadowRoot.getElementById("modal").classList.remove("active");
  }
}

customElements.define("add-to-playlist", AddToPlaylist);
