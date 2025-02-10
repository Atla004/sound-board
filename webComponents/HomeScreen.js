class HomeScreen extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <main>
        <sound-card text="Sound 1"></sound-card>
        <sound-card text="Sound 2"></sound-card>
        <sound-card text="Sound 3"></sound-card>
        <!-- Add more sound cards as needed -->
      </main>
    `;
  }
}

customElements.define("home-screen", HomeScreen);
