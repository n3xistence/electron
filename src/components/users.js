const { ipcRenderer } = require("electron");
const helper = require('../ext/helper')

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

  if (!input.value){ 
    input.focus(); 
    return alert("Please Input a User ID or name.")
  }

	ipcRenderer.send('request-userdata-full', input.value);
});

document.getElementById("user-id-input").addEventListener("keydown", (event) => {
	if (event.key !== "Enter") return;
  let input = document.getElementById('user-id-input');
  
  if (!input.value) return alert("Please Input a User ID or name.")
  ipcRenderer.send("request-userdata-full", input.value);
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
		
  let input = document.getElementById('user-id-input');
	ipcRenderer.send("refresh-data", input.value);
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

ipcRenderer.on('data-diff-weekly', (e, data) => {
  updateUserNameContainer(data.name);
  updateStepsContainer(data);
  updateLevelsContainer(data);
  updateNPCContainer(data);
  updatePVPContainer(data);
  updateTimeframeDisplay(data.week1.dates, data.week2.dates);
});

ipcRenderer.on('loaded', (e, data) => {
  updateTimeframeDisplay(data.week1.dates, data.week2.dates);
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

const updateStepsContainer = (data) => {
  let childSteps = document.getElementById("weeklydiff-steps");

  let stepDiffWeek1 = data.week1.steps[data.week1.steps.length - 1] - data.week1.steps[0];
  let stepDiffWeek2 = data.week2.steps[data.week2.steps.length - 1] - data.week2.steps[0];

  let stepRatio =
    stepDiffWeek1 > stepDiffWeek2
      ? ((stepDiffWeek2 - stepDiffWeek1) / stepDiffWeek1 * 100).toFixed(2)
      : Math.abs((stepDiffWeek2 - stepDiffWeek1) / stepDiffWeek1 * 100).toFixed(2);

  if (stepRatio.split('.')[1] == "00") stepRatio = parseInt(stepRatio);

  childSteps.innerHTML = `<div class="float-left whitespace-nowrap w-[50%]">
      <div class="text-left">Steps:  ${
        stepRatio > 0
          ? `<i class="fa-solid fa-caret-up text-green-400"></i>
            +${stepRatio}%`
          : `<i class="fa-solid fa-caret-down text-red-700"></i>
            ${stepRatio}%`
      }</div>
      <div class="text-left">Last Week: ${stepDiffWeek1}</div>
      <div class="text-left">This Week: ${stepDiffWeek2}</div>
    </div>
    <div class='float-right w-[50%] h-[100%] flex items-center'>
      <canvas id='user-steps-graph' class='max-w-[68px] ml-auto mr-0 hover:scale-110 tansition-transform duration-200'></canvas>
    </div>
    `;

  let ctx = document.getElementById("user-steps-graph").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Last Week", "This Week"],
      datasets: [
        {
          label: "Step Gains",
          data: [stepDiffWeek1, stepDiffWeek2],
          backgroundColor: [
            "rgba(47, 75, 124, 0.2)",
            "rgba(249, 93, 106, 0.2)",
          ],
          borderColor: ["rgba(47, 75, 124, 1)", "rgba(249, 93, 106, 1)"],
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
};

const updateLevelsContainer = (data) => {
  let childLevels = document.getElementById("weeklydiff-levels");

  let levelDiffWeek1 = data.week1.levels[data.week1.levels.length - 1] - data.week1.levels[0];
  let levelDiffWeek2 = data.week2.levels[data.week2.levels.length - 1] - data.week2.levels[0];

  let levelRatio =
    levelDiffWeek1 > levelDiffWeek2
      ? ((levelDiffWeek2 - levelDiffWeek1) / levelDiffWeek1 * 100).toFixed(2)
      : Math.abs((levelDiffWeek2 - levelDiffWeek1) / levelDiffWeek1 * 100).toFixed(2);

  if (levelRatio.split('.')[1] == "00") levelRatio = parseInt(levelRatio);

  childLevels.innerHTML = `<div class="float-left whitespace-nowrap w-[50%]">
      <div class="text-left">Levels:  ${
        levelRatio > 0
          ? `<i class="fa-solid fa-caret-up text-green-400"></i>
            +${levelRatio}%`
          : `<i class="fa-solid fa-caret-down text-red-700"></i>
            ${levelRatio}%`
      }</div>
      <div class="text-left">Last Week: ${levelDiffWeek1}</div>
      <div class="text-left">This Week: ${levelDiffWeek2}</div>
    </div>
    <div class='float-right w-[50%] h-[100%] flex items-center'>
      <canvas id='user-levels-graph' class='max-w-[68px] ml-auto mr-0 hover:scale-110 tansition-transform duration-200'></canvas>
    </div>
    `;

  let ctx = document.getElementById("user-levels-graph").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Last Week", "This Week"],
      datasets: [
        {
          label: "Level Gains",
          data: [levelDiffWeek1, levelDiffWeek2],
          backgroundColor: [
            "rgba(47, 75, 124, 0.2)",
            "rgba(249, 93, 106, 0.2)",
          ],
          borderColor: ["rgba(47, 75, 124, 1)", "rgba(249, 93, 106, 1)"],
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
};

const updateNPCContainer = (data) => {
  let childNPC = document.getElementById("weeklydiff-npc");

  let npcDiffWeek1 = data.week1.npc[data.week1.npc.length - 1] - data.week1.npc[0];
  let npcDiffWeek2 = data.week2.npc[data.week2.npc.length - 1] - data.week2.npc[0];

  let npcRatio =
    npcDiffWeek1 > npcDiffWeek2
      ? ((npcDiffWeek2 - npcDiffWeek1) / npcDiffWeek1 * 100).toFixed(2)
      : Math.abs((npcDiffWeek2 - npcDiffWeek1) / npcDiffWeek1 * 100).toFixed(2)

  if (npcRatio.split('.')[1] == "00") npcRatio = parseInt(npcRatio);

  childNPC.innerHTML = `<div class="float-left whitespace-nowrap w-[50%]">
      <div class="text-left">NPC Kills:  ${
        npcRatio > 0
          ? `<i class="fa-solid fa-caret-up text-green-400"></i>
            +${npcRatio}%`
          : `<i class="fa-solid fa-caret-down text-red-700"></i>
            ${npcRatio}%`
      }</div>
      <div class="text-left">Last Week: ${npcDiffWeek1}</div>
      <div class="text-left">This Week: ${npcDiffWeek2}</div>
    </div>
    <div class='float-right w-[50%] h-[100%] flex items-center'>
      <canvas id='user-npc-graph' class='max-w-[68px] ml-auto mr-0 hover:scale-110 tansition-transform duration-200'></canvas>
    </div>
    `;

  let ctx = document.getElementById("user-npc-graph").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Last Week", "This Week"],
      datasets: [
        {
          label: "NPC Gains",
          data: [npcDiffWeek1, npcDiffWeek2],
          backgroundColor: [
            "rgba(47, 75, 124, 0.2)",
            "rgba(249, 93, 106, 0.2)",
          ],
          borderColor: ["rgba(47, 75, 124, 1)", "rgba(249, 93, 106, 1)"],
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
};

const updatePVPContainer = (data) => {
  let childPVP = document.getElementById("weeklydiff-pvp");

  let pvpDiffWeek1 = data.week1.pvp[data.week1.pvp.length - 1] - data.week1.pvp[0];
  let pvpDiffWeek2 = data.week2.pvp[data.week2.pvp.length - 1] - data.week2.pvp[0];

  let pvpRatio =
    pvpDiffWeek1 > pvpDiffWeek2
      ? ((pvpDiffWeek2 - pvpDiffWeek1) / pvpDiffWeek1 * 100).toFixed(2)
      : Math.abs((pvpDiffWeek2 - pvpDiffWeek1) / pvpDiffWeek1 * 100).toFixed(2);

  if (pvpRatio.split('.')[1] == "00") pvpRatio = parseInt(pvpRatio);
      
  childPVP.innerHTML = `<div class="float-left whitespace-nowrap w-[50%]">
      <div class="text-left">PVP Kills:  ${
        pvpRatio > 0
          ? `<i class="fa-solid fa-caret-up text-green-400"></i>
            +${pvpRatio}%`
          : `<i class="fa-solid fa-caret-down text-red-700"></i>
            ${pvpRatio}%`
      }</div>
      <div class="text-left">Last Week: ${pvpDiffWeek1}</div>
      <div class="text-left">This Week: ${pvpDiffWeek2}</div>
    </div>
    <div class='float-right w-[50%] h-[100%] flex items-center'>
      <canvas id='user-pvp-graph' class='max-w-[68px] ml-auto mr-0 hover:scale-110 tansition-transform duration-200'></canvas>
    </div>
    `;

  let ctx = document.getElementById("user-pvp-graph").getContext("2d");
  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Last Week", "This Week"],
      datasets: [
        {
          label: "PVP Gains",
          data: [pvpDiffWeek1, pvpDiffWeek2],
          backgroundColor: [
            "rgba(47, 75, 124, 0.2)",
            "rgba(249, 93, 106, 0.2)",
          ],
          borderColor: ["rgba(47, 75, 124, 1)", "rgba(249, 93, 106, 1)"],
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
};

const updateTimeframeDisplay = (week1, week2) => {
  let w1Display = document.getElementById('week1-display-timeframe');
  let w2Display = document.getElementById('week2-display-timeframe');

  let week1Timeframe = 
    `${helper.dateToShortText(week1[0])} - ${helper.dateToShortText(week1[week1.length - 1])}`

  let week2Timeframe = 
    `${helper.dateToShortText(week2[0])} - ${helper.dateToShortText(week2[week2.length - 1])}`

  w1Display.innerText = week1Timeframe;
  w2Display.innerText = week2Timeframe;
};

const updateUserNameContainer = (name) => {
  let div = document.getElementById('user-name-display');
  div.innerHTML = 
    `<div class="inline-block">User:</div>
     <div id="last-refresh" class="inline-block">${name}</div>`
  div.classList.add("float-left", "bg-[#343c49]", "rounded", "align-middle", "relative", "h-full", "p-2", "ml-[10px]", "text-white");
}