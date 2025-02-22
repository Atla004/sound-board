class IndexedDBComponent {
  constructor() {
    this.dbName = "SoundBoardDB";
    this.storeName = "songs";
    this.playlistStoreName = "playlists";
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

        if (!this.db.objectStoreNames.contains(this.playlistStoreName)) {
          this.db.createObjectStore(this.playlistStoreName, {
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

  async saveSong(song, playlist_id = 1) {
    await this.initPromise; // Wait for initialization
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.add(song);
      console.log("playlistid", playlist_id);
      request.onsuccess = async () => {
        const newSongId = request.result;
        try {
          // Update playlist with id 1 always
          const playlist1 = await this.getPlaylist(1);
          playlist1.playlist.push(newSongId);
          await this.updatePlaylist(playlist1);
          // If a different playlist_id is provided, update that playlist too
          if (playlist_id !== 1) {
            const customPlaylist = await this.getPlaylist(playlist_id);
            customPlaylist.playlist.push(newSongId);
            await this.updatePlaylist(customPlaylist);
          }
        } catch (error) {
          console.error("Error updating playlists", error);
        }
        resolve(newSongId);
      };
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

  async getAllSongs(playlistId=1) {
    await this.initPromise; // Wait for initialization
    try {
      const playlist = await this.getPlaylist(playlistId);
      if (!playlist || !playlist.playlist) return [];
      const songPromises = playlist.playlist.map((id) => this.getSong(id));
      const songs = await Promise.all(songPromises);
      return songs.filter(Boolean);
    } catch (error) {
      console.error("Error fetching songs for playlist", error);
      return [];
    }
  
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

  // Added new methods for playlist store

  async savePlaylist(playlist) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [this.playlistStoreName],
        "readwrite"
      );
      const store = transaction.objectStore(this.playlistStoreName);
      const request = store.add(playlist);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPlaylist(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [this.playlistStoreName],
        "readonly"
      );
      const store = transaction.objectStore(this.playlistStoreName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPlaylists() {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [this.playlistStoreName],
        "readonly"
      );
      const store = transaction.objectStore(this.playlistStoreName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updatePlaylist(playlist) {
    await this.initPromise;
    const existingPlaylist = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [this.playlistStoreName],
        "readonly"
      );
      const store = transaction.objectStore(this.playlistStoreName);
      const request = store.get(playlist.id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (!existingPlaylist) {
      return Promise.reject(new Error("Playlist not found"));
    }
    const updatedPlaylist = { ...existingPlaylist, ...playlist };
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [this.playlistStoreName],
        "readwrite"
      );
      const store = transaction.objectStore(this.playlistStoreName);
      const request = store.put(updatedPlaylist);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePlaylist(id) {
    await this.initPromise;
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [this.playlistStoreName],
        "readwrite"
      );
      const store = transaction.objectStore(this.playlistStoreName);
      const request = store.delete(Number(id));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const instance = new IndexedDBComponent();
export default instance;
