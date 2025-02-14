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
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s, box-shadow 0.3s;
        }

        .edit-sound:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }

        .edit-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          cursor: pointer;
          background: #f8f9fa;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .edit-icon:hover {
          background: #e9ecef;
        }

        .modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }

        .modal.show {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
          width: 90%;
          max-width: 400px;
        }

        input {
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

        #applyButton {
          background: #2ecc71;
          color: white;
        }

        #applyButton:hover {
          background: #27ae60;
        }

        #closeModal {
          background: #e9ecef;
          color: #495057;
        }

        #closeModal:hover {
          background: #dee2e6;
        }

        #deleteButton {
          background: #e74c3c;
          color: white;
        }

        #deleteButton:hover {
          background: #c0392b;
        }

        @media (max-width: 768px) {
          .modal-content {
            width: 95%;
            padding: 16px;
          }
        }
      </style>
      <div class="edit-sound">
        <span id="songText">${this.getAttribute("text") || ""}</span>
        <span class="edit-icon" id="editIcon">✏️</span>
        <div class="modal">
          <div class="modal-content">
            <input type="text" id="nameInput" placeholder="New song name" />
            <div class="modal-buttons">
              <button id="closeModal">Cancel</button>
              <button id="deleteButton">Delete</button>
              <button id="applyButton">Save</button>
            </div>
          </div>
        </div>
      </div>
    `;
    this.db = null;
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
    this.shadowRoot.querySelector(".modal").classList.remove("show");
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
        this.remove();
      })
      .catch((error) => console.error("Error deleting song:", error));
  }

  saveChanges() {
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
      id: Number(this.songId),
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