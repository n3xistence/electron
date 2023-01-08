const { ipcRenderer } = require("electron");

ipcRenderer.on('maximized-window', () => {
	let button = document.getElementById("maximize-button");

	if (windowState === "flex") {
		windowState = "maximized";
		button.innerHTML = `<i class="fa-solid fa-window-restore" style="font-size: 15px"></i>`;
	} else {
		windowState = "flex";
		button.innerHTML = `<i class="fa-regular fa-window-maximize" style="font-size: 15px"></i>`;
	}
})

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
		button.innerHTML = `<i class="fa-regular fa-window-maximize" style="font-size: 15px"></i>`;
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

let currentSelection = "level";
document.getElementById("dropdown-default").addEventListener("click", () => {
	let parent = document.getElementById("dropdown-default");
	document
		.getElementById("dropdown-live-levles")
		.addEventListener("click", (e) => {
			e.preventDefault();
			parent.innerHTML = replaceSelectionText("Levels");
			ipcRenderer.send("request-dropdown-data", "level");
			currentSelection = "level";
			resetDropdown();
		});
	document
		.getElementById("dropdown-live-steps")
		.addEventListener("click", (e) => {
			e.preventDefault();
			parent.innerHTML = replaceSelectionText("Steps");
			ipcRenderer.send("request-dropdown-data", "steps");
			currentSelection = "steps";
			resetDropdown();
		});
	document
		.getElementById("dropdown-live-npc")
		.addEventListener("click", (e) => {
			e.preventDefault();
			parent.innerHTML = replaceSelectionText("NPC");
			ipcRenderer.send("request-dropdown-data", "npc");
			currentSelection = "npc";
			resetDropdown();
		});
	document
		.getElementById("dropdown-live-pvp")
		.addEventListener("click", (e) => {
			e.preventDefault();
			parent.innerHTML = replaceSelectionText("PVP");
			ipcRenderer.send("request-dropdown-data", "pvp");
			currentSelection = "pvp";
			resetDropdown();
		});

	const resetDropdown = () => {
		let parent = document.getElementById("dropdown-default");
		let div = document.getElementById("dropdown");
		div.classList.remove("block");
		div.classList.add("hidden");
		parent.click();
	};
});

document.getElementById("submit-filters").addEventListener("click", () => {
	ipcRenderer.send("request-dropdown-data", currentSelection);
});

document
	.getElementById("max-value-input")
	.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") return;
		ipcRenderer.send("request-dropdown-data", currentSelection);
	});
document
	.getElementById("min-value-input")
	.addEventListener("keydown", (event) => {
		if (event.key !== "Enter") return;
		ipcRenderer.send("request-dropdown-data", currentSelection);
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

	//set all elements to skeleton pulse placeholders for the remainder of the sync
	let containers = [document.getElementById("users-linked")];
	containers.forEach((container) => {
		container.innerHTML = addSkeletonPulse_Container(container);
	});
	let graph = document.getElementById("chart");
	graph.innerHTML = addSkeletonPulse_Graph(graph);

	//request the new data
	ipcRenderer.send("refresh-data");
});

ipcRenderer.on("sftp-connected", () => {});

ipcRenderer.on("data-fetched", () => {
	if (buttonAnimation) {
		buttonAnimation.cancel();
		buttonAnimation = null;
	}
	ipcRenderer.send("request-dropdown-data", currentSelection);
});

ipcRenderer.on("data-links-all", (e, data) => {
	let panel = document.getElementById("users-linked");
	let guild1 = [];
	let guild2 = [];
	data.forEach((user) => {
		if (user.guild === 1970) guild1.push(user.link);
		else guild2.push(user.link);
	});

	panel.innerHTML = `<div class="float-left whitespace-nowrap w-[50%]">
							<div>Linked Users: ${data.length}</div>
							<div>Babel: ${guild1.length}</div>
							<div>Babel2: ${guild2.length}</div>
						</div>
						<div class='float-right w-[50%] h-[100%] flex items-center'>
							<canvas id='guild-links-graph' class='max-w-[100%] hover:scale-110 tansition-transform duration-200'></canvas>
						</div>`;

	let ctx = document.getElementById("guild-links-graph").getContext("2d");
	new Chart(ctx, {
		type: "doughnut",
		data: {
			labels: ["Babel", "Babel 2"],
			datasets: [
				{
					label: "Guild Members",
					data: [guild1.length, guild2.length],
					backgroundColor: [
						"rgba(255, 99, 132, 0.2)",
						"rgba(54, 162, 235, 0.2)",
					],
					borderColor: ["rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)"],
					hoverOffset: 4,
				},
			],
		},
		options: {
			legend: {
				display: false,
			},
			maintainAspectRatio: false,
		},
	});
});

ipcRenderer.on("data-live", (e, data) => {
	let input1 = document.getElementById("min-value-input").value;
	let input2 = document.getElementById("max-value-input").value;
	if (input1 || input2)
		var filters = { min: parseInt(input1), max: parseInt(input2) };

	let type = data.type;
	data.sort((a, b) => b[type] - a[type]);
	let entries = [];
	let names = [];
	if (filters) {
		data = data.filter((e) => {
			if (filters.min !== NaN && filters.max !== NaN)
				return !(e[type] < filters.min) && !(e[type] > filters.max);
			if (filters.min !== NaN) return !(e[type] < filters.min);
			if (filters.max !== NaN) return !(e[type] > filters.max);
		});
	}

	data.forEach((user) => {
		entries.push(user[type]);
		names.push(user.name);
	});

	let div = document.getElementById("chart");

	let ctx = document.createElement("canvas");

	div.innerHTML = "";
	div.appendChild(ctx);

	new Chart(ctx, {
		type: "bar",
		data: {
			labels: [...names],
			datasets: [
				{
					label: type,
					data: [...entries],
					borderWidth: 1,
					backgroundColor: "#64c5b1",
					borderColor: "#54a594",
				},
			],
		},
		options: {
			scales: {
				y: {
					beginAtZero: true,
				},
				xAxes: [
					{
						display: false,
					},
				],
			},
		},
	});
});

ipcRenderer.on("last-sync", (e, data) => {
	let div = document.getElementById("last-refresh");
	div.innerText = data;
});

const replaceSelectionText = (input) => {
	return `${input}
	<svg class="ml-2 w-4 h-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
	</svg>`;
};

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

const addSkeletonPulse_Container = (tag) => {
	return `<div role="status" class="animate-pulse">
				<h3 id="line1" class="h-2.5 bg-gray-200 rounded-full  w-[100%] mb-4"></h3>
				<div id="line2" class="h-2 bg-gray-200 rounded-full  max-w-[70%] mb-2.5"></div>
				<div id="line3" class="h-2 bg-gray-200 rounded-full  max-w-[80%] mb-2.5"></div>
				<span class="sr-only">Loading...</span>
			</div>`;
};
