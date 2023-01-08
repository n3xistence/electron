const { ipcRenderer } = require("electron");

let windowState = "flex";
document.getElementById("exit-button").addEventListener("click", () => {
	ipcRenderer.send("close-window");
});

document.getElementById("maximize-button").addEventListener("click", () => {
	if (windowState === "flex") ipcRenderer.send("maximize-window");
	else ipcRenderer.send("restore-window");
});

ipcRenderer.on('window-maximized', () => {
	let button = document.getElementById("maximize-button");

	if (windowState === "flex") {
		windowState = "maximized";
		button.innerHTML = `<i class="fa-solid fa-window-restore" style="font-size: 15px"></i>`;
	} else {
		windowState = "flex";
		button.innerHTML = `<i class="fa-regular fa-window-maximize" style="font-size: 15px"></i>`;
	}
})

ipcRenderer.on('window-unmaximized', () => {
	let button = document.getElementById("maximize-button");

	if (windowState === "flex") {
		windowState = "maximized";
		button.innerHTML = `<i class="fa-solid fa-window-restore" style="font-size: 15px"></i>`;
	} else {
		windowState = "flex";
		button.innerHTML = `<i class="fa-regular fa-window-maximize" style="font-size: 15px"></i>`;
	}
})

document.getElementById("minimize-button").addEventListener("click", () => {
	ipcRenderer.send("minimize-window");
});

document.getElementById("menu-toggle").addEventListener("click", () => {
	let parent = document.getElementById("menu-toggle");
	parent.classList.toggle("change");

	let menuItems = document.getElementsByClassName("menu-item");
	let menu = document.getElementById("menu");
	let mainContent = document.getElementById("main-content");

	for (let elem of menuItems) {
		if (elem.style.display === "none" || elem.style.display === "")
			elem.style.display = "block";
		else elem.style.display = "none";
	}

	if (menu.style.left === "" || menu.style.left === "-200px") {
		menu.style.left = "0";
		mainContent.style.left = "200px";
	} else {
		menu.style.left = "-200px";
		mainContent.style.left = "0";
	}
});

// close the menu if it's opened and the main content is clicked
document.getElementById("main-content").addEventListener("click", () => {
	let menuButton = document.getElementById("menu-toggle");
	let menu = document.getElementById("menu");
	let mainContent = document.getElementById("main-content");

	if (menu.style.left === "0px") {
		menuButton.classList.toggle("change");
		menu.style.left = "-200px";
		mainContent.style.left = "0";
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
	ipcRenderer.send("open-users-page");
});

document.getElementById("submit-filters").addEventListener('click', (e) => {
	let input = document.getElementById('user-id-input');
	if (!input.value) return alert("Please Input a User ID")

	ipcRenderer.send('request-userdata-full', input.value);
});

document.getElementById("user-id-input").addEventListener("keydown", (event) => {
	let input = document.getElementById('user-id-input');
	if (event.key === "Enter") ipcRenderer.send("request-userdata-full", input.value);
});

let buttonAnimation;
document.getElementById("request-sftp").addEventListener("click", () => {
	if (buttonAnimation) return;

	buttonAnimation = document
		.getElementById("sftp-icon")
		.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
			duration: 2000,
			easing: "linear",
			iterations: Infinity,
		});

	let graph = document.getElementById("chart");
	graph.innerHTML = addSkeletonPulse_Graph(graph);
		
	ipcRenderer.send("refresh-data");
});

ipcRenderer.on("sftp-connected", () => {});

ipcRenderer.on("data-fetched", () => {
	if (buttonAnimation) {
		buttonAnimation.cancel();
		buttonAnimation = null;
	}
});

ipcRenderer.on("last-sync", (e, data) => {
	let div = document.getElementById("last-refresh");
	div.innerText = data;
});

ipcRenderer.on("data-user-all", (e, data) => {
  let datasets = [];
  let axis;
  for (let prop in data) {
    let color;
    switch (prop) {
      case "dates":
        continue;
      case "levels":
        color = "#003f5c";
        axis = "y-axis-1";
        break;
      case "steps":
        color = "#2f4b7c";
        axis = "y-axis-1";
        break;
      case "npc":
        color = "#665191";
        axis = "y-axis-1";
        break;
      case "pvp":
        color = "#a05195";
        axis = "y-axis-1";
        break;
      case "quests":
        color = "#d45087";
        axis = "y-axis-1";
        break;
      case "tasks":
        color = "#f95d6a";
        axis = "y-axis-2";
        break;
      case "bosses":
        color = "#ff7c43";
        axis = "y-axis-2";
        break;
      case "bounties":
        color = "#ffa600";
        axis = "y-axis-2";
        break;
      default:
        console.log("whoops");
        break;
    }

    datasets.push({
      label: prop,
      data: [...data[prop]],
      borderWidth: 1,
      borderColor: color,
      pointRadius: 0,
      fill: false,
      borderWidth: 3,
      yAxisID: axis,
    });
  }

  let div = document.getElementById("chart");

  let ctx = document.createElement("canvas");

  div.innerHTML = "";
  div.appendChild(ctx);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: data.dates,
      datasets: datasets,
    },
    options: {
      legend: {
		display: true,
        position: 'right',
		labels: {
			padding: 20
		}
      },
      scales: {
        y: {
          beginAtZero: true,
        },
        xAxes: [
          {
            display: false,
          },
        ],
        yAxes: [
          {
            id: "y-axis-1",
            type: "linear",
            position: "left",
            ticks: {
              beginAtZero: true,
            },
          },
          {
            id: "y-axis-2",
            type: "linear",
            position: "right",
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
});

const addSkeletonPulse_Graph = (tag) => {
	return `<div role="status" class="p-4 max-w-sm rounded border border-gray-200 shadow animate-pulse md:p-6">
				<div class="h-2.5 bg-gray-200 rounded-full  w-32 mb-2.5"></div>
				<div class="mb-10 w-48 h-2 bg-gray-200 rounded-full "></div>
				<div class="flex items-baseline mt-4 space-x-6">
					<div class="w-full h-36 bg-gray-200 rounded-t-lg "></div>
					<div class="w-full h-24 bg-gray-200 rounded-t-lg "></div>
					<div class="w-full h-36 bg-gray-200 rounded-t-lg "></div>
					<div class="w-full h-24 bg-gray-200 rounded-t-lg "></div>
					<div class="w-full h-24 bg-gray-200 rounded-t-lg "></div>
					<div class="w-full h-36 bg-gray-200 rounded-t-lg "></div>
					<div class="w-full h-24 bg-gray-200 rounded-t-lg "></div>
				</div>
				<span class="sr-only">Loading...</span>
			</div>`;
};