class IndexedDBComponent {
  constructor() {
    this.dbName = "SoundBoardDB";
    this.storeName = "songs";
    this.db = null;
    this.initPromise = this.init(); // Store the promise
  }

  init() {
    return new Promise((resolve, reject) => { // Return a promise
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        if (!this.db.objectStoreNames.contains(this.storeName)) {
          this.db.createObjectStore(this.storeName, {
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
}

const instance = new IndexedDBComponent();
export default instance;