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
        #soundList {
          display: grid;
          margin-bottom: 10px;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 10px;
          width: 90%;
          padding: 20px;
        }
        #addNewSoundButtonSvg {
          position: relative;
          background:rgba(229, 218, 218, 0.42);
          border-radius: 12px;
          margin-top: 10px;
          margin-bottom:10px;
          border: 3px dashed; 
          border-color:rgb(90, 91, 90);
        }
        #addNewSoundButtonSvg:hover {
          background: rgb(251 251 251 / 71%);
        }
        #addNewSoundButtonSvg svg {
          width: 36px;
          height: 36px;
          fill: #2ecc71;
          transition: fill 0.2s;
        }
        #addNewSoundButtonSvg:hover svg {
          fill: #27ae60;
        }
        /* Estilos del modal copiados de EditSound.js */
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
        /* Estilos copiados de EditSound.js para el input y botones */
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
        button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }
        #saveNewSound {
          background: #2ecc71;
          color: white;
        }
        #saveNewSound:hover {
          background: #27ae60;
        }
        #cancelNewSound {
          background: #e9ecef;
          color: #495057;
        }
        #cancelNewSound:hover {
          background: #dee2e6;
        }
        /* Estilos para el file input customizado */
        .custom-file-input label {
          display: inline-block;
          background:rgb(81, 125, 168);
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          width: 95%;
          text-align: center;
          margin: 10px 0;
          transition: background 0.2s;
        }
        .custom-file-input label:hover {
          background: #dee2e6;
        }
        .custom-file-input input[type="file"] {
          display: none;
        }
        .custom-file-input.selected label::after {
          content: attr(data-file-name);
          display: block;
          margin-top: 10px;
          font-size: 14px;
          color: #495057;
        }
      </style>

      <div id="soundList">
            
      <button id="addNewSoundButtonSvg">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
            </svg>
      </button>

          
      </div>

      <div class="modal">
        <div class="modal-card">
          <input type="text" id="newSoundTitle" placeholder="Song Title" required><br><br>
          <div class="custom-file-input">
            <label id="fileLabel" for="newSoundFile">Choose file</label>
            <input type="file" id="newSoundFile" accept="audio/*" required>
          </div>
          <br>
          <button id="saveNewSound">Save</button>
          <button id="cancelNewSound">Cancel</button>
        </div>
      </div>
    `;
  }

  async checkAndAddDefaultSong() {
    const songs = await this.db.getAllSongs();
    if (songs.length === 0) {
      console.log("No hay canciones, agregando spongebob-fail.mp3 por defecto");
      const response = await fetch("/spongebob-fail.mp3");
      const blob = await response.blob();
      const defaultSong = {
        title: "Default Song",
        data: blob,
      };
      await this.db.saveSong(defaultSong);
      document.dispatchEvent(new CustomEvent("songs-updated"));
    }
  }

  async connectedCallback() {
    await this.checkAndAddDefaultSong();

    document.addEventListener("songs-imported", (event) => {
      console.log("Songs importedddd");
      this.loadSounds();

    });

    



    this.loadSounds();

    this.shadowRoot
      .querySelector("#soundList")
      .querySelector("#addNewSoundButtonSvg")
      .addEventListener("click", () => this.openModal());

    this.shadowRoot
      .querySelector("#saveNewSound")
      .addEventListener("click", () => this.saveNewSound());
    this.shadowRoot
      .querySelector("#cancelNewSound")
      .addEventListener("click", () => this.closeModal());
    this.shadowRoot
      .querySelector("#newSoundFile")
      .addEventListener("change", (event) => this.updateFileName(event));
  }

  openModal() {
    this.shadowRoot.querySelector(".modal").classList.add("show");
  }

  closeModal() {
    this.shadowRoot.querySelector(".modal").classList.remove("show");
  }

  updateFileName(event) {
    const fileInput = event.target;
    const fileName = fileInput.files[0]
      ? fileInput.files[0].name
      : "Choose file";
    const label = this.shadowRoot.querySelector(".custom-file-input label");
    label.setAttribute("data-file-name", fileName);
    if (fileInput.files[0]) {
      label.parentElement.classList.add("selected");
    } else {
      label.parentElement.classList.remove("selected");
    }
  }

  async saveNewSound() {
    const titleInput = this.shadowRoot.querySelector("#newSoundTitle");
    const fileInput = this.shadowRoot.querySelector("#newSoundFile");

    if (!titleInput.checkValidity() || !fileInput.checkValidity()) {
      titleInput.reportValidity();
      fileInput.reportValidity();
      return;
    }

    const title = titleInput.value;
    const file = fileInput.files[0];

    // Guardamos también el archivo de audio
    const newSong = {
      title: title,
      data: file,
    };

    this.db.saveSong(newSong).then(() => {
      this.loadSounds();
      this.closeModal();
      // Reset the input values
      titleInput.value = "";
      fileInput.value = "";
      this.shadowRoot
        .querySelector(".custom-file-input")
        .classList.remove("selected");
      document.dispatchEvent(new CustomEvent("songs-updated"));
    });
  }

  async loadSounds() {
    console.log("Loading sounds...");
    const songs = await this.db.getAllSongs();
    console.log("Songs:", songs);
    const soundList = this.shadowRoot.querySelector("#soundList");

    soundList.innerHTML = `
          <button id="addNewSoundButtonSvg">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z"/>
            </svg>
          </button>
          `;

      this.shadowRoot
      .querySelector("#soundList")
      .querySelector("#addNewSoundButtonSvg")
      .addEventListener("click", () => this.openModal());

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
