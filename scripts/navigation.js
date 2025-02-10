function showScreen(screenId) {
  const screens = ["home-screen", "manage-playlist-screen"];
  screens.forEach((id) => {
    document.getElementById(id).style.display =
      id === screenId ? "block" : "none";
  });
}

function addNewSound() {
  // Logic to add a new sound
}
