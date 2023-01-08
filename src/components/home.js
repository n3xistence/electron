const { ipcRenderer } = require("electron");

let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

const titleBar = document.getElementById("title-bar");

titleBar.addEventListener("mousedown", (e) => {
	isDragging = true;
	initialX = e.clientX;
	initialY = e.clientY;
	currentX = e.clientX;
	currentY = e.clientY;
});

titleBar.addEventListener("mousemove", (e) => {
	if (isDragging) {
		e.preventDefault();
		currentX = e.clientX;
		currentY = e.clientY;

		xOffset = currentX - initialX;
		yOffset = currentY - initialY;

		ipcRenderer.send("moveWindow", xOffset, yOffset);
	}
});

titleBar.addEventListener("mouseup", () => {
	isDragging = false;

	ipcRenderer.send("window-placed", currentX, currentY);
});

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

document.getElementById("stats-menu-item").addEventListener("click", () => {
	ipcRenderer.send("open-stats-page");
});

document.getElementById("home-menu-item").addEventListener("click", () => {
	ipcRenderer.send("open-home-page");
});

document.getElementById("settings-menu-item").addEventListener("click", () => {
	ipcRenderer.send("open-settings-page");
});

document.getElementById("users-menu-item").addEventListener("click", () => {
	console.log("click");
	ipcRenderer.send("open-users-page");
});

// document.getElementById('menu-toggle').addEventListener('click', () => {
//     let menu = document.getElementsByClassName('menu-item');
//     for (let elem of menu){
//         console.log(elem.style)
//         if (elem.style.display === "none") elem.classList.add('invisible');
//         else elem.classList.remove('invisible');
//     }
// });
