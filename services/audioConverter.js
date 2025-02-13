import db from "./indexdb.js";

/**
 * Convierte un archivo File a una cadena Base64.
 * @param {File} file - El archivo de audio a convertir.
 * @returns {Promise<string>} - Una promesa que se resuelve con la cadena Base64 del archivo.
 */
function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file); // Devuelve el resultado en formato Base64 con el prefijo de tipo MIME
  });
}

/**
 * Guarda una cadena JSON en un archivo JSON descargable.
 * @param {string} jsonStr - La cadena JSON que se guardará.
 * @param {string} [fileName="audio.json"] - Nombre para el archivo JSON.
 */
function saveJSONToFile(jsonStr, fileName = "audio.json") {
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  // Crea un enlace para descargar el archivo JSON
  const downloadLink = document.createElement("a");
  downloadLink.href = url;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

/**
 * Función principal que convierte todas las canciones en IndexedDB a Base64 y las guarda en un archivo JSON
 * @param {string} [fileName="audio.json"] - Nombre para el archivo JSON de salida.
 */
async function exportAllSongsToJSON(fileName = "audio.json") {
  try {
    const songs = await db.getAllSongs();
    const processedSongs = await Promise.all(
      songs.map(async (song) => {
        const base64Data = await convertFileToBase64(song.data);
        return {
          title: song.title,
          data: base64Data,
        };
      })
    );
    const jsonStr = JSON.stringify(processedSongs, null, 2);
    saveJSONToFile(jsonStr, fileName);
    console.log("Las canciones han sido convertidas y guardadas correctamente.");
  } catch (error) {
    console.error("Error al procesar los archivos de audio:", error);
  }
}/**
 * Convierte una cadena Base64 a un Blob.
 * @param {string} base64 - La cadena Base64 a convertir.
 * @returns {Blob} - El Blob resultante.
 */
function convertBase64ToBlob(base64) {
  const byteString = atob(base64.split(',')[1]);
  const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Importa canciones desde un archivo JSON.
 * @param {File} file - El archivo JSON que contiene las canciones.
 */
async function importSongsFromJSON(file) {
  try {
    const fileContent = await file.text();
    const songs = JSON.parse(fileContent);
    await Promise.all(
      songs.map(async (song) => {
        const blob = convertBase64ToBlob(song.data);
        const newSong = {
          title: song.title,
          data: blob,
        };
        await db.saveSong(newSong);
      })
    );
    console.log("Las canciones han sido importadas correctamente.");
    document.dispatchEvent(new CustomEvent("songs-updated"));
  } catch (error) {
    console.error("Error al importar las canciones:", error);
  }
}

export { convertFileToBase64, saveJSONToFile, exportAllSongsToJSON, importSongsFromJSON };