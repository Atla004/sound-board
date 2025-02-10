class EditSound extends HTMLElement {
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
      </style>
      <div class="edit-sound">
        <span>${this.getAttribute("text")}</span>
        <span class="edit-icon" onclick="this.nextElementSibling.classList.toggle('show')">✏️</span>
        <div class="modal">
          <button onclick="changeSound()">Change</button>
          <button onclick="deleteSound()">Delete</button>
          <button onclick="editText()">Edit Text</button>
        </div>
      </div>
    `;
  }
}

customElements.define("edit-sound", EditSound);

function changeSound() {
  // Logic to change the sound
}

function deleteSound() {
  // Logic to delete the sound
}

function editText() {
  // Logic to edit the text
}
