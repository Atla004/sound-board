class ManagePlaylistScreen extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        edit-sound {
          display: block;
          margin: 10px 0;
        }
      </style>
      <div>
        <button onclick="addNewSound()">+</button>
        <edit-sound text="Edit Sound 1"></edit-sound>
        <edit-sound text="Edit Sound 2"></edit-sound>
        <edit-sound text="Edit Sound 3"></edit-sound>
        <!-- Add more edit-sound components as needed -->
      </div>
    `;
  }
}

customElements.define("manage-playlist-screen", ManagePlaylistScreen);
