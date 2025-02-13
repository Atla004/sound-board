class EditSound extends HTMLElement {
  static get observedAttributes() {
    return ["song-id", "text"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        .edit-sound {
          position: relative;
          border: 1px solid #ccc;
          padding: 10px;
          margin: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .edit-icon {
          position: absolute;
          top: 5px;
          right: 5px;
          cursor: pointer;
        }
        .modal {
          display: none;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .modal.show {
          display: block;
        }
        .modal-buttons {
          margin-top: 10px;
          display: flex;
          gap: 10px;
          justify-content: center;
        }
      </style>
      <div class="edit-sound">
        <span id="songText">${this.getAttribute("text") || ""}</span>
        <span class="edit-icon" id="editIcon">✏️</span>
        <div class="modal">
          <input type="text" id="nameInput" placeholder="New song name" />
          <div class="modal-buttons">
            <button id="applyButton">Apply</button>
            <button id="closeModal">Close</button>
            <button id="deleteButton">Delete</button>
          </div>
        </div>
      </div>
    `;
    this.db = null; // Será inicializado externamente
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "song-id" && !newValue) {
      throw new Error("song-id attribute is required for edit-sound component");
    }
    if (name === "text" && this.shadowRoot) {
      this.shadowRoot.getElementById("songText").innerText = newValue;
    }
  }

  connectedCallback() {
    this.songId = this.getAttribute("song-id");
    if (!this.songId) {
      throw new Error("song-id attribute is required for edit-sound component");
    }

    // Al hacer clic en el icono, actualizamos el input y mostramos el modal
    this.shadowRoot.getElementById("editIcon")
      .addEventListener("click", () => {
        const text = this.getAttribute("text") || "";
        this.shadowRoot.getElementById("nameInput").value = text;
        this.shadowRoot.querySelector(".modal").classList.add("show");
      });
    
    this.shadowRoot
      .getElementById("deleteButton")
      .addEventListener("click", () => this.deleteSound());
    this.shadowRoot
      .getElementById("closeModal")
      .addEventListener("click", () => this.closeModal());
    this.shadowRoot
      .getElementById("applyButton")
      .addEventListener("click", () => this.saveChanges());

  }

  setDatabase(db) {
    this.db = db;
  }

  closeModal() {
    this.shadowRoot.querySelector(".modal").classList.remove
    ("show");
  }

  changeSound() {
    // Logic to change the sound
    console.log("Change sound clicked for song ID:", this.songId);
    // Dispatch a custom event
    const changeEvent = new CustomEvent("song-changed", {
      detail: { songId: this.songId },
    });
    this.dispatchEvent(changeEvent);
  }

  deleteSound() {
    if (!this.db) {
      console.error("Database not initialized.");
      return;
    }
    

    console.log("Delete sound clicked for song ID:", this.songId);

    this.db.deleteSong(this.songId)
      .then(() => {
        console.log("Song deleted with ID:", this.songId);
        const deleteEvent = new CustomEvent("song-deleted", {
          detail: { songId: this.songId },
        });
        this.dispatchEvent(deleteEvent);
        this.remove(); // Remove the element from the DOM
      })
      .catch((error) => console.error("Error deleting song:", error));
  }

  saveChanges(){
    if (!this.db) {
      console.error("Database not initialized.");
      return;
    }
    const newName = this.shadowRoot.getElementById("nameInput").value;
    if (!newName) {
      alert("Please enter a new name.");
      return;
    }
    console.log("Save changes clicked for song ID:", this.songId);
    const song = {
      id: Number(this.songId), // Convertir a number
      title: newName,
    };
    this.db.updateSong(song)
      .then(() => {
        console.log("Song updated with ID:", this.songId);
        this.shadowRoot.getElementById("songText").innerText = newName;
        this.setAttribute("text", newName);
        const updateEvent = new CustomEvent("song-edited");
        this.dispatchEvent(updateEvent);
        this.closeModal();
      })
      .catch((error) => console.error("Error updating song:", error));
  }


}

customElements.define("edit-sound", EditSound);