const { ipcRenderer } = require("electron");
const Router = require("../modules/router");
const menuLayout = require("../modules/menuLayout");

document.getElementById("menu").innerHTML = menuLayout.layout("wars");

Router.routes();

let windowState = "flex";
document.getElementById("exit-button").addEventListener("click", () => {
  ipcRenderer.send("close-window");
});

document.getElementById("maximize-button").addEventListener("click", () => {
  let button = document.getElementById("maximize-button");

  if (windowState === "flex") {
    windowState = "maximized";
    button.innerHTML = `<i class="fa-solid fa-window-restore" style="font-size: 15px"></i>`;
    ipcRenderer.send("maximize-window");
  } else {
    windowState = "flex";
    button.innerHTML = `<i class="fa-solid fa-window-maximize" style="font-size: 15px"></i>`;
    ipcRenderer.send("restore-window");
  }
});

document.getElementById("minimize-button").addEventListener("click", () => {
  ipcRenderer.send("minimize-window");
});

document.getElementById("menu-toggle").addEventListener("click", () => {
  let parent = document.getElementById("menu-toggle");
  parent.classList.toggle("change");

  let menuItems = document.getElementsByClassName("menu-item");
  let menu = document.getElementById("menu");
  let mainContent = document.getElementById("main-content");
  // let topBox = document.getElementById("top-box");

  for (let elem of menuItems) {
    if (elem.style.display === "none" || elem.style.display === "")
      elem.style.display = "block";
    else elem.style.display = "none";
  }

  if (menu.style.left === "" || menu.style.left === "-200px") {
    menu.style.left = "0";
    mainContent.style.left = "200px";
    // topBox.style.left = "150px";
  } else {
    menu.style.left = "-200px";
    mainContent.style.left = "0";
    // topBox.style.left = "0";
  }
});
