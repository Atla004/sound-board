import "../webComponents/EditSound.js";
import db from "../services/indexdb.js";


class ManagePlaylistScreen extends HTMLElement {
  constructor() {
    super();
    this.db = db;
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        edit-sound {
          display: block;
          margin: 10px 0;
        }
        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        .modal-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          text-align: center;
        }
        .modal.show {
          display: block;
        }
      </style>
      <div>
        <button id="addNewSoundButton">+</button>
        <div id="soundList">
          <!-- edit-sound components will be added here -->
        </div>
      </div>
      <div class="modal">
        <div class="modal-content">
          <h2>Add New Sound</h2>
          <input type="text" id="newSoundTitle" placeholder="Song Title" required><br><br>
          <input type="file" id="newSoundFile" accept="audio/*" required><br><br>
          <button id="saveNewSound">Save</button>
          <button id="cancelNewSound">Cancel</button>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.loadSounds();

    this.shadowRoot
      .querySelector("#addNewSoundButton")
      .addEventListener("click", () => this.openModal());
    this.shadowRoot
      .querySelector("#saveNewSound")
      .addEventListener("click", () => this.saveNewSound());
    this.shadowRoot
      .querySelector("#cancelNewSound")
      .addEventListener("click", () => this.closeModal());
  }

  openModal() {
    this.shadowRoot.querySelector(".modal").classList.add("show");
  }

  closeModal() {
    this.shadowRoot.querySelector(".modal").classList.remove("show");
  }

  async saveNewSound() {
    const titleInput = this.shadowRoot.querySelector("#newSoundTitle");
    const fileInput = this.shadowRoot.querySelector("#newSoundFile");
    const title = titleInput.value;
    const file = fileInput.files[0];

    if (!title || !file) {
      alert("Please enter both a title and select a sound file.");
      return;
    }



    // Guardamos también el archivo de audio
    const newSong = {
      title: title,
      data: file // Aseguramos guardar el archivo (que es un Blob)
    };

    this.db.saveSong(newSong).then(() => {
      this.loadSounds();
      this.closeModal();
      // Reset the input values
      titleInput.value = "";
      fileInput.value = "";
    });
  }

  async loadSounds() {
    console.log("Loading sounds...");
    const songs = await this.db.getAllSongs();
    console.log("Songs:", songs);
    const soundList = this.shadowRoot.querySelector("#soundList");

    soundList.innerHTML = ""; // Clear the list before re-rendering

    songs.forEach((song) => {
      const editSound = document.createElement("edit-sound");
      editSound.setAttribute("text", song.title); // Set attributes
      editSound.setAttribute("song-id", song.id);
      editSound.setDatabase(this.db); // Call setDatabase
      soundList.appendChild(editSound); // Append to the list

      editSound.addEventListener("song-deleted", (event) => {
        this.loadSounds();
        document.dispatchEvent(new CustomEvent("songs-updated"));
      });

      editSound.addEventListener("song-edited", (event) => {
        this.loadSounds();
        document.dispatchEvent(new CustomEvent("songs-updated"));
      });


    });
  }
}

customElements.define("manage-playlist-screen", ManagePlaylistScreen);