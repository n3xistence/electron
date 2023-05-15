const { ipcRenderer } = require("electron");

exports.routes = () => {
  document.getElementById("stats-menu-item").addEventListener("click", () => {
    ipcRenderer.send("open-stats-page");
  });

  document.getElementById("home-menu-item").addEventListener("click", () => {
    ipcRenderer.send("open-home-page");
  });

  document.getElementById("wars-menu-item").addEventListener("click", () => {
    ipcRenderer.send("open-wars-page");
  });

  document.getElementById("users-menu-item").addEventListener("click", () => {
    ipcRenderer.send("open-users-page");
  });

  document
    .getElementById("settings-menu-item")
    .addEventListener("click", () => {
      ipcRenderer.send("open-settings-page");
    });
};
