class IndexedDBComponent {
  constructor() {
    this.dbName = "SoundBoardDB";
    this.storeName = "songs";
    this.db = null;
    this.initPromise = this.init(); // Store the promise
  }

  init() {
    return new Promise((resolve, reject) => {
      // Return a promise
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          this.db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        // Crear store para playlists si no existe
        if (!this.db.objectStoreNames.contains("playlists")) {
          this.db.createObjectStore("playlists", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(); // Resolve the promise when successful
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.errorCode);
        reject(event.target.errorCode); // Reject the promise on error
      };
    });
  }

  async saveSong(song) {
    await this.initPromise; // Wait for initialization
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add(song);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSong(id) {
    await this.initPromise; // Wait for initialization
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSongs() {
    await this.initPromise; // Wait for initialization
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSong(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(Number(id));

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSong(song) {
    await this.initPromise; // Espera la inicialización

    // Primero se obtiene la canción existente a partir del id
    const existingSong = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.get(song.id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!existingSong) {
      return Promise.reject(new Error("Song not found"));
    }

    // Se combinan los campos existentes con los nuevos usando spread operator
    const updatedSong = { ...existingSong, ...song };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.put(updatedSong);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /* Métodos para manejo de playlist */
  async savePlaylist(playlist) {
    console.log("Playlist to be saved:", playlist); // Added log

    // Si playlist es una cadena, crear un objeto con el nombre de la playlist
    if (typeof playlist === "string") {
      playlist = { name: playlist };
    }

    await this.initPromise;
    // Remove "id" from playlist to prevent key conflicts with autoIncrement.
    const { id, ...playlistNoId } = playlist;

    // Agregar console.log para ver qué se va a guardar
    console.log("Playlist to be saved:", playlistNoId);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["playlists"], "readwrite");
      const store = transaction.objectStore("playlists");
      const request = store.add(playlistNoId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  async getPlaylist(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["playlists"], "readonly");
      const store = transaction.objectStore("playlists");
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPlaylists() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["playlists"], "readonly");
      const store = transaction.objectStore("playlists");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePlaylist(playlist) {
    await this.initPromise;
    // Obtener playlist existente
    const existingPlaylist = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["playlists"], "readonly");
      const store = transaction.objectStore("playlists");
      const request = store.get(playlist.id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!existingPlaylist) {
      return Promise.reject(new Error("Playlist not found"));
    }

    const updatedPlaylist = { ...existingPlaylist, ...playlist };
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["playlists"], "readwrite");
      const store = transaction.objectStore("playlists");
      const request = store.put(updatedPlaylist);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePlaylist(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["playlists"], "readwrite");
      const store = transaction.objectStore("playlists");
      const request = store.delete(Number(id));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Updated alias for createPlaylist
  createPlaylist(playlist) {
    console.log("About to save playlist:", playlist); // Added log
    return this.savePlaylist(playlist);
  }

  async getSongsByPlaylist(playlistId) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const songs = request.result.filter(
          (song) => song.playlistId === playlistId
        );
        resolve(songs);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

const instance = new IndexedDBComponent();
export default instance;
