class PlaylistSelector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.playlists = [];
    this.currentPlaylistId = 1;
  }
  
  // Agregar getter para la playlist activa
  get selectedPlaylist() {
    return this.currentPlaylistId;
  }

  async connectedCallback() {
    console.log("PlaylistSelector connected");
    await this.loadPlaylists();
    this.render();
    this.attachListeners();
  }

  async loadPlaylists() {
    const db = await import("../services/indexdb.js").then((m) => m.default);
    this.playlists = await db.getAllPlaylists();
    if (this.playlists.length === 0) {
      // Create default playlist if none exists
      const newPlaylistId = await db.createPlaylist("defalt");
      this.currentPlaylistId = newPlaylistId;
      this.playlists = await db.getAllPlaylists();
    }
    console.log("Fetched playlists:", this.playlists);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .playlist-selector {
          position: fixed;
          top: 80px;
          left: 20px;
          z-index: 1000;
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
          min-width: 200px;
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
        }

        .dropdown-content.show {
          display: block;
        }

        .playlist-item {
          padding: 12px;
          color: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
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
      </style>
      <div class="playlist-selector">
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
                  ${playlist.name}
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
    `;
  }

  getCurrentPlaylistName() {
    if (this.playlists.length === 0) {
      return "Create a Playlist";
    }
    const currentPlaylist = this.playlists.find(
      (p) => p.id === this.currentPlaylistId
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
      item.addEventListener("click", () => {
        const playlistId = Number(item.dataset.id);
        this.currentPlaylistId = playlistId;
        this.dispatchEvent(
          new CustomEvent("playlist-changed", {
            detail: { playlistId },
          })
        );
        dropdownContent.classList.remove("show");
        dropdownButton.classList.remove("active");
        this.render();
      });
    });

    const createNewPlaylist = async () => {
      const name = prompt("Enter playlist name:");
      console.log("Creating new playlist with name:", name); // Added log
      if (name) {
        const db = await import("../services/indexdb.js").then(
          (m) => m.default
        );
        const newPlaylistId = await db.createPlaylist(name);
        console.log("Guardando playlist, enviado:", {
          playlistId: newPlaylistId,
        }); // Added log
        await this.loadPlaylists();
        this.currentPlaylistId = newPlaylistId;
        this.dispatchEvent(
          new CustomEvent("playlist-changed", {
            detail: { playlistId: newPlaylistId },
          })
        );
        this.render();
        this.attachListeners();
      }
    };

    addPlaylistButton.addEventListener("click", createNewPlaylist);

    // Close dropdown when clicking outside using composedPath()
    document.addEventListener("click", (event) => {
      if (!event.composedPath().includes(this)) {
        dropdownContent.classList.remove("show");
        dropdownButton.classList.remove("active");
      }
    });
  }
}

customElements.define("playlist-selector", PlaylistSelector);
