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

let tableSortingOptions = {
  g1Name: false,
  g2Name: false,
  g1Kills: false,
  g2Kills: false,
};

const resetSortingOptions = () => {
  for (let key in tableSortingOptions) {
    tableSortingOptions[key] = false;
  }
};

let warData;
ipcRenderer.on("data-wars", (e, data) => {
  warData = data;
  const { winning, losing, ties } = compileWarStats(warData);

  let parent = document.getElementById("warlist");
  parent.innerHTML = makeWarListElement(winning);

  parent.addEventListener("click", (e) => {
    if (e.target.id !== "table-headers") return;
    sortTableByHeader(
      warData,
      e.target.textContent.replace(" ▼", "").replace(" ▲", "").trim()
    );

    let rows = parent.querySelectorAll("tr");
    for (let i = 1; i < rows.length; i++) {
      rows[i].remove();
    }
    let tBody = parent.querySelector("tbody");
    tBody.innerHTML += makeWarListFragment(warData);

    let currentSort = e.target.classList.contains("sort-desc") ? "desc" : "asc";

    let headers = document.querySelectorAll("#table-headers");
    headers.forEach((h) => {
      h.classList.remove("sort-asc", "sort-desc");
      h.innerHTML = h.innerHTML.replace(" ▼", "").replace(" ▲", "").trim();

      let normalizedContent = e.target.innerHTML
        .replace(" ▼", "")
        .replace(" ▲", "")
        .trim();
      if (h.innerHTML === normalizedContent) {
        let newSort = currentSort === "asc" ? "desc" : "asc";

        h.classList.add(`sort-${newSort}`);

        h.innerHTML = `${h.innerHTML} ${newSort === "asc" ? " ▼" : " ▲"}`;
      }
    });

    // let indicator = e.target.textContent[e.target.textContent.length - 1];

    // if (indicator !== "▼" && indicator !== "▲") {
    //   e.target.textContent += " ▼";
    // } else {
    //   e.target.textContent = e.target.textContent.replace(
    //     /.$/,
    //     `${
    //       e.target.textContent[e.target.textContent.length - 1] === "▲"
    //         ? "▼"
    //         : "▲"
    //     }`
    //   );
    // }
  });
});

const sortTableByHeader = (list, header) => {
  const sortNumsByKey = (a, b, key, inverse = false) =>
    (inverse ? -1 : 1) * a[key] - b[key];

  const sortStringsByKey = (a, b, key, inverse = false) =>
    (inverse ? -1 : 1) *
    a[key].toLowerCase().localeCompare(b[key].toLowerCase());

  switch (header) {
    case "Initiator":
      list.sort((a, b) =>
        sortStringsByKey(a, b, "guild_1_name", tableSortingOptions.g1Name)
      );
      resetSortingOptions();
      tableSortingOptions.g1Name = !tableSortingOptions.g1Name;
      break;
    case "Initiator Kills":
      list.sort((a, b) =>
        sortNumsByKey(a, b, "guild_1_kills", tableSortingOptions.g1Kills)
      );
      resetSortingOptions();
      tableSortingOptions.g1Kills = !tableSortingOptions.g1Kills;
      break;
    case "Defender Kills":
      list.sort((a, b) =>
        sortNumsByKey(a, b, "guild_2_kills", tableSortingOptions.g2Kills)
      );
      resetSortingOptions();
      tableSortingOptions.g2Kills = !tableSortingOptions.g2Kills;
      break;
    case "Defender":
      list.sort((a, b) =>
        sortStringsByKey(a, b, "guild_2_name", tableSortingOptions.g2Name)
      );
      resetSortingOptions();
      tableSortingOptions.g2Name = !tableSortingOptions.g2Name;
      break;
    default:
      break;
  }
};

const formatName = (name, len = 15) =>
  name.length > len ? `${name.slice(0, len)}...` : name;

const makeWarListFragment = (list) => {
  return list
    .map((e) => {
      return `<tr class="p-2 rounded border-t border-b border-gray-800">
            <td class="text-right px-2 border-r-2 border-gray-800">${formatName(
              e.guild_1_name
            )}</td>
            <td class="text-right px-2 border-r-2 border-gray-800">${
              e.guild_1_kills
            }</td>
            <td class="text-left px-2 border-r-2 border-gray-800">${
              e.guild_2_kills
            }</td>
            <td class="text-left px-2">${formatName(e.guild_2_name)}</td>
          </tr>`;
    })
    .join("");
};

const makeWarListElement = (list) => {
  return `<table id="war-table" class="table-fixed rounded relative bg-[#343c49] m-auto">
    <tr>
      <td id="table-headers" class="cursor-pointer font-bold px-2 text-right border-r-2 border-gray-800">Initiator</td>
      <td id="table-headers" class="cursor-pointer font-bold px-2 text-right border-r-2 border-gray-800">Initiator Kills</td>
      <td id="table-headers" class="cursor-pointer font-bold px-2 text-left border-r-2 border-gray-800">Defender Kills</td>
      <td id="table-headers" class="cursor-pointer font-bold px-2 text-left">Defender</td>
    </tr>
    ${list
      .map((e) => {
        return `<tr class="p-2 rounded border-t border-b border-gray-800">
              <td class="text-right px-2 border-r-2 border-gray-800">${formatName(
                e.guild_1_name
              )}</td>
              <td class="text-right px-2 border-r-2 border-gray-800">${
                e.guild_1_kills
              }</td>
              <td class="text-left px-2 border-r-2 border-gray-800">${
                e.guild_2_kills
              }</td>
              <td class="text-left px-2">${formatName(e.guild_2_name)}</td>
            </tr>`;
      })
      .join("")}
    </table>`;
};

const compileWarStats = (warList, options = {}) => {
  const { winInverse, loseInverse, diff } = options;

  let winning = [];
  let losing = [];
  let ties = [];
  for (let i = 0; i < warList.length; i++) {
    if (warList[i].guild_1_kills === warList[i].guild_2_kills) {
      ties.push(warList[i]);
      continue;
    }

    if (warList[i].guild_1_id === 1970) {
      if (warList[i].guild_1_kills > warList[i].guild_2_kills)
        winning.push(warList[i]);
      else losing.push(warList[i]);
    } else {
      if (warList[i].guild_2_kills > warList[i].guild_1_kills)
        winning.push(warList[i]);
      else losing.push(warList[i]);
    }
  }

  const losingSort = (a, b, inverse = false) =>
    (inverse ? -1 : 1) *
    ((a.guild_1_id === 1970 ? a.guild_1_kills : a.guild_2_kills) -
      (b.guild_1_id === 1970 ? b.guild_1_kills : b.guild_2_kills));

  const defaultSort = (a, b, inverse = false) =>
    (inverse ? -1 : 1) *
    ((b.guild_1_id === 1970 ? b.guild_1_kills : b.guild_2_kills) -
      (a.guild_1_id === 1970 ? a.guild_1_kills : a.guild_2_kills));

  const diffSort = (a, b, inverse = false) =>
    (inverse ? -1 : 1) *
    (Math.abs(b.guild_1_kills - b.guild_2_kills) -
      Math.abs(a.guild_1_kills - a.guild_2_kills));

  if (diff) winning.sort((a, b) => diffSort(a, b, winInverse));
  else winning.sort((a, b) => defaultSort(a, b, winInverse));

  losing.sort((a, b) => losingSort(a, b, loseInverse));

  return { winning, losing, ties };
};
