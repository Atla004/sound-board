class PlaylistSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.playlists = [];
    this.currentPlaylistId = 1;
  }

  get selectedPlaylist() {
    return this.currentPlaylistId;
  }

  async connectedCallback() {
    await this.loadPlaylists();
    await this.render();
    this.attachListeners();
  }

  async loadPlaylists() {
    const db = await import("../services/indexdb.js").then((m) => m.default);
    this.playlists = await db.getAllPlaylists();
    if (this.playlists.length === 0) {
      console.log("No playlists available, creating All playlist"); // Added log
      const newPlaylistId = await db.savePlaylist({
        name: "All",
        playlist: [],
      });
      this.currentPlaylistId = newPlaylistId;
      this.playlists = await db.getAllPlaylists();
    }
  }

  async render() {
    this.shadowRoot.innerHTML = `
      <style>
        .playlist-selector-container {
          position: absolute;
        }

        .dropdown-button {
          background: #2d2d2d;
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 94px;
          justify-content: space-between;
        }

        .dropdown-button:hover {
          background: #363636;
          border-color: rgba(99, 102, 241, 0.5);
        }

        .dropdown-content {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          background: #2d2d2d;
          min-width: 200px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          margin-top: 8px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
        }

        .dropdown-content.show {
          display: block;
        }

        .playlist-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          color: #ffffff;
          cursor: pointer;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .playlist-item:hover {
          background: #363636;
        }

        .add-playlist {
          padding: 12px;
          color: var(--accent-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .add-playlist:hover {
          background: #363636;
        }

        .empty-state {
          padding: 16px;
          color: var(--text-secondary);
          text-align: center;
          font-style: italic;
        }

        .arrow {
          border: solid #ffffff;
          border-width: 0 2px 2px 0;
          display: inline-block;
          padding: 3px;
          transform: rotate(45deg);
        }

        .dropdown-button .arrow {
          transition: transform 0.3s ease;
        }

        .dropdown-button.active .arrow {
          transform: rotate(-135deg);
        }

        .button-text {
          flex: 1;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .delete-playlist {
          cursor: pointer;
          color: red;
          margin-left: 8px;
        }

        /* Modal styles copied from EditSound.js */
        .modal {
          opacity: 0;
          transition: opacity 0.3s ease;
          visibility: hidden;
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
          align-items: center; 
          justify-content: center;
        }
        .modal.show {
          opacity: 1;
          visibility: visible;
        }
        .modal-card {
          background: white;
          border-radius: 12px;
          width: 300px;
          padding: 20px;
        }
        input {
          box-sizing: border-box;
          width: 100%;
          padding: 10px;
          margin: 10px 0;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.2s;
        }
        input:focus {
          outline: none;
          border-color: #3498db;
        }
        .modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        #applyPlaylistButton {
          background: #2ecc71;
          color: white;
        }
        #applyPlaylistButton:hover {
          background: #27ae60;
        }
        #closePlaylistModal {
          background: #e9ecef;
          color: #495057;
        }
        #closePlaylistModal:hover {
          background: #dee2e6;
        }
      </style>
      <div class="playlist-selector-container">
        <button class="dropdown-button">
          <span class="button-text">${this.getCurrentPlaylistName()}</span>
          <span class="arrow"></span>
        </button>
        <div class="dropdown-content">
          ${
            this.playlists.length === 0
              ? '<div class="empty-state">No playlists available</div>'
              : this.playlists
                  .map(
                    (playlist) => `
                <div class="playlist-item" data-id="${playlist.id}">
                  <span class="playlist-name">${playlist.name}</span>
                  ${
                    playlist.name !== "All"
                      ? `<span class="delete-playlist" data-id="${playlist.id}">x</span>`
                      : ""
                  }
                </div>
              `
                  )
                  .join("")
          }
          <div class="add-playlist">
            <span>+ Add New Playlist</span>
          </div>
        </div>
      </div>
      <!-- New modal for adding playlist -->
      <div class="modal" id="playlistModal">
        <div class="modal-card">
          <input type="text" id="playlistNameInput" placeholder="New playlist name" maxlength="30" />
          <div class="modal-buttons">
            <button id="applyPlaylistButton">Apply</button>
            <button id="closePlaylistModal">Close</button>
          </div>
        </div>
      </div>
    `;
  }

  getCurrentPlaylistName() {
    if (this.playlists.length === 0) {
      console.log("No playlists available, creating All playlist");
      savePlaylist({ name: "All", playlist: [] });
      this.loadPlaylists();
    }
    const currentPlaylist = this.playlists.find(
      (p) => p.id === this.currentPlaylistId
    );

    // Dispatch event when the current playlist changes
    this.dispatchEvent(
      new CustomEvent("playlist-changed", {
        detail: { playlistId: this.currentPlaylistId },
      })
    );

    return currentPlaylist ? currentPlaylist.name : "Select Playlist";
  }

  attachListeners() {
    const dropdownButton = this.shadowRoot.querySelector(".dropdown-button");
    const dropdownContent = this.shadowRoot.querySelector(".dropdown-content");
    const addPlaylistButton = this.shadowRoot.querySelector(".add-playlist");

    dropdownButton.addEventListener("click", () => {
      dropdownContent.classList.toggle("show");
      dropdownButton.classList.toggle("active");
    });

    this.shadowRoot.querySelectorAll(".playlist-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-playlist")) return;
        const playlistId = Number(item.dataset.id);
        this.currentPlaylistId = playlistId;
        window.currentPlaylistId = playlistId; // Actualizamos el id global
        this.dispatchEvent(
          new CustomEvent("playlist-changed", {
            detail: { playlistId },
          })
        );
        dropdownContent.classList.remove("show");
        dropdownButton.classList.remove("active");
        const buttonText = this.shadowRoot.querySelector(".button-text");
        buttonText.textContent = this.getCurrentPlaylistName();
      });
    });

    this.shadowRoot.querySelectorAll(".delete-playlist").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const playlistId = Number(btn.dataset.id);
        const db = await import("../services/indexdb.js").then(
          (m) => m.default
        );
        await db.deletePlaylist(playlistId);
        await this.loadPlaylists();
        this.render();
        this.attachListeners();
      });
    });

    // Replace prompt-based createNewPlaylist with modal functionality
    addPlaylistButton.addEventListener("click", () => {
      const modal = this.shadowRoot.getElementById("playlistModal");
      const input = this.shadowRoot.getElementById("playlistNameInput");
      input.value = "";
      modal.classList.add("show");
    });

    // Modal button listeners for adding playlist
    this.shadowRoot
      .getElementById("applyPlaylistButton")
      .addEventListener("click", async () => {
        const name = this.shadowRoot.getElementById("playlistNameInput").value;
        if (name) {
          const db = await import("../services/indexdb.js").then(
            (m) => m.default
          );
          const newPlaylistId = await db.savePlaylist({ name, playlist: [] });
          this.currentPlaylistId = newPlaylistId;
          window.currentPlaylistId = newPlaylistId; // Actualizamos el id global
          this.dispatchEvent(
            new CustomEvent("playlist-changed", {
              detail: { playlistId: newPlaylistId },
            })
          );
          await this.loadPlaylists();
          this.render();
          this.attachListeners();
        }
        this.shadowRoot
          .getElementById("playlistModal")
          .classList.remove("show");
      });

    this.shadowRoot
      .getElementById("closePlaylistModal")
      .addEventListener("click", () => {
        this.shadowRoot
          .getElementById("playlistModal")
          .classList.remove("show");
      });

    document.addEventListener("click", (event) => {
      if (!event.composedPath().includes(this)) {
        dropdownContent.classList.remove("show");
        dropdownButton.classList.remove("active");
      }
    });
  }
}

customElements.define("playlist-selectors", PlaylistSelector);
