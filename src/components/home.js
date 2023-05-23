const { ipcRenderer } = require("electron");
const Router = require("../modules/router");
const menuLayout = require("../modules/menuLayout");

const menu = new menuLayout();
document.getElementById("menu").innerHTML = menu.layout("home");

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

ipcRenderer.on("data-guildstats", (e, data) => {
  createGraph(data);

  let div = document.getElementById("guild-health");
  div.innerHTML = compileGuildHealth(data);

  compileDailyMovement(data);
});

const createGraph = (data) => {
  let objects = {
    dates: [...data].map((e) => e.date),
    exp: [...data].map((e) => e.exp),
    memberCount: [...data].map((e) => e.member_count),
  };

  let datasets = [];
  for (let prop in objects) {
    switch (prop) {
      case "exp":
        var color = "#ffd080";
        var axis = "y-axis-1";
        break;
      case "memberCount":
        var color = "#ed174f";
        var axis = "y-axis-2";
        break;
      default:
        continue;
    }

    datasets.push({
      label: prop,
      data: objects[prop],
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
      labels: objects.dates,
      datasets: datasets,
    },
    options: {
      legend: {
        display: true,
        position: "right",
        labels: {
          padding: 20,
        },
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
};

const compileGuildHealth = (data) => {
  let list = [...data].reverse().slice(0, 14);

  let weekNow = list.slice(0, 7);
  let weekThen = list.slice(7, 14);

  let now = {
    members: weekNow[0].member_count,
    exp: weekNow[0].exp - weekNow[6].exp,
  };
  let then = {
    members: weekThen[0].member_count,
    exp: weekThen[0].exp - weekThen[6].exp,
  };

  let change = now.exp / then.exp;
  let ratio = ((change - 1) * 100).toFixed(2);

  let cssStyle;
  let health;
  if (ratio >= 0) {
    if (ratio > 10) {
      health = "excellent";
      cssStyle = "color: green;";
    } else if (ratio > 5) {
      health = "ok";
      cssStyle = "color: blue;";
    } else {
      health = "good";
      cssStyle = "color: yellow;";
    }
  } else {
    if (ratio < -10) {
      health = "terrible";
      cssStyle = "color: red;";
    } else if (ratio > -5) {
      health = "ok";
      cssStyle = "color: blue;";
    } else {
      health = "bad";
      cssStyle = "color: orange;";
    }
  }

  return `The guild is in <span style="${cssStyle}">${health}</span> health.`;
};

const compileDailyMovement = (data) => {
  let list = [...data].reverse().slice(0, 14);

  let changeNowExp = list[0].exp - list[1].exp;
  let changeThenExp = list[1].exp - list[2].exp;
  let ratioExp = changeNowExp / changeThenExp - 1;
  if (ratioExp === Infinity) ratioExp = 0;

  let changeNowMembers = list[0].member_count - list[1].member_count;
  let changeThenMembers = list[1].member_count - list[2].member_count;
  let ratioMembers = changeNowMembers / changeThenMembers - 1;
  if (ratioMembers === Infinity) ratioMembers = 0;

  let childExp = document.getElementById("guild-exp");
  let childMembers = document.getElementById("guild-members");

  childExp.innerHTML = `<div class="float-left whitespace-nowrap w-[50%]">
    <div class="text-left text-lg">EXP:  ${
      ratioExp >= 0
        ? `<i class="fa-solid fa-caret-up text-green-400"></i>
          +${(ratioExp * 100).toFixed(2)}%`
        : `<i class="fa-solid fa-caret-down text-red-700"></i>
          ${(ratioExp * 100).toFixed(2)}%`
    }</div>
    <div class="text-left ml-4">Yesterday: ${changeThenExp.toLocaleString()}</div>
    <div class="text-left ml-4">Today: ${changeNowExp.toLocaleString()}</div>
  </div>
  <div class='float-right w-[50%] h-[100%] flex items-center'>
    <canvas id='user-steps-graph' class='max-w-[68px] ml-auto mr-0 hover:scale-110 tansition-transform duration-200'></canvas>
  </div>
  `;

  childMembers.innerHTML = `<div class="float-left whitespace-nowrap w-[50%]">
    <div class="text-left text-lg">Members:  ${
      ratioMembers >= 0
        ? `<i class="fa-solid fa-caret-up text-green-400"></i>
          +${(ratioMembers * 100).toFixed(2)}%`
        : `<i class="fa-solid fa-caret-down text-red-700"></i>
          ${(ratioMembers * 100).toFixed(2)}%`
    }</div>
    <div class="text-left ml-4">Yesterday: ${changeThenMembers.toLocaleString()}</div>
    <div class="text-left ml-4">Today: ${changeNowMembers.toLocaleString()}</div>
  </div>
  <div class='float-right w-[50%] h-[100%] flex items-center'>
    <canvas id='user-steps-graph' class='max-w-[68px] ml-auto mr-0 hover:scale-110 tansition-transform duration-200'></canvas>
  </div>
  `;
};
