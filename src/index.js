import { app, BrowserWindow, ipcMain, dialog, globalShortcut } from "electron";
import Client from "ssh2-sftp-client";
import sqlite3 from "better-sqlite3";
import helper from "./ext/helper";
import fs from "fs";
import config from "./config/sftp";

//remove for production
import tailwind from "tailwindcss";
module.exports = {
  plugins: [tailwind("./tailwind.config.js")],
};

if (fs.existsSync("./data")) {
  if (fs.existsSync("./data/userdata.db") && fs.existsSync("./data/data.db")) {
    var db_gen = new sqlite3(`./data/data.db`);
    var db_ud = new sqlite3(`./data/userdata.db`);
    db_gen.pragma("journal_mode = WAL");
    db_ud.pragma("journal_mode = WAL");
  }
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) app.quit();

let mainWindow;

let pageURL;
const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    movable: true,
    titlebar: "customButtonsOnHover",
    backgroundColor: "#2c313e",
    frame: false,
    show: false,
    nodeIntegration: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  //initialize window
  mainWindow.loadURL(`file://${__dirname}/components/wars.html`);

  // mainWindow.webContents.openDevTools();

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window-maximized");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window-unmaximized");
  });

  mainWindow.webContents.on("did-finish-load", (window) => {
    if (
      !fs.existsSync("data/userdata.db") ||
      !fs.existsSync("data/userdata.db")
    )
      return;

    let history = window.sender.history;
    let pages = history[history.length - 1].split("/");
    pageURL = pages[pages.length - 1];

    if (pageURL === "stats.html") {
      let leveldata = getLevelData();
      leveldata.type = "level";
      mainWindow.webContents.send("data-live", leveldata);

      let links = getLinkData();
      mainWindow.webContents.send("data-links-all", links);

      let stamp = getTimeStamp();
      mainWindow.webContents.send("last-sync", stamp);
    } else if (pageURL === "users.html") {
      let stamp = getTimeStamp();
      mainWindow.webContents.send("last-sync", stamp);

      try {
        var userdata = getUserAlltimeStats({ id: "261266" });
      } catch (e) {
        return mainWindow.webContents.send("error", e.message);
      }

      let weeklystats = getUserRecentWeeklyData(userdata);
      mainWindow.webContents.send("loaded", weeklystats);
    } else if (pageURL === "wars.html") {
      let wars = getWarData();
      mainWindow.webContents.send("data-wars", wars);
    }
  });
};

ipcMain.on("open-home-page", () => {
  mainWindow.loadURL(`file://${__dirname}/components/home.html`);
});

ipcMain.on("open-stats-page", () => {
  mainWindow.loadURL(`file://${__dirname}/components/stats.html`);
});

ipcMain.on("open-users-page", () => {
  mainWindow.loadURL(`file://${__dirname}/components/users.html`);
});

ipcMain.on("open-wars-page", () => {
  mainWindow.loadURL(`file://${__dirname}/components/wars.html`);
});

ipcMain.on("open-settings-page", () => {
  // mainWindow.loadURL(`file://${__dirname}/components/settings.html`);
});

let syncInProgress = false; //prevent users from spamming the sync button when a sync is in progress
ipcMain.on("refresh-data", async (e, arg) => {
  if (syncInProgress) return;

  syncInProgress = true;
  const sftp = new Client();

  try {
    let progress = 0;
    let speed = 0.01;
    let increment = setInterval(() => {
      if (progress > 1 || progress < 0 || !syncInProgress)
        clearInterval(increment);

      if (progress >= 0.85) progress += speed * 2; //speed up the progress bar when it's almost done
      progress += speed;
      mainWindow.setProgressBar(progress);
    }, 100);

    await sftp.connect(config.sftp);
    e.sender.send("sftp-connected");
    progress += 0.1;

    const userdata = await sftp.get("/data/userdata.db");
    const data = await sftp.get("/data/data.db");

    // write files to local storage so user can check this data even when offline
    if (!fs.existsSync("data")) fs.mkdirSync("data");
    fs.writeFileSync("data/userdata.db", userdata, (err) => {
      if (err) console.log(err);
    });
    fs.writeFileSync("data/data.db", data, (err) => {
      if (err) console.log(err);
    });
    fs.writeFileSync(
      "data/lastrefresh.json",
      JSON.stringify({ stamp: Math.floor(new Date() / 1000) }, null, "\t"),
      (err) => {
        if (err) console.log(err);
      }
    );

    db_ud = sqlite3("./data/userdata.db");
    db_gen = sqlite3("./data/data.db");
    e.sender.send("data-fetched");

    //return data depending on which page called
    switch (pageURL) {
      case "stats.html":
        // link data
        let links = getLinkData();
        e.sender.send("data-links-all", links);

        mainWindow.webContents.send("last-sync", getTimeStamp());
        break;
      case "users.html":
        if (arg) {
          let user = {};
          if (!arg.match(/\D/)) user.id = arg;
          else user.name = arg;

          try {
            var user_data = getUserAlltimeStats(user);
          } catch (e) {
            return mainWindow.webContents.send("error", e.message);
          }

          e.sender.send("data-user-all", user_data);

          let weeklydata = getUserRecentWeeklyData(user_data);
          e.sender.send("data-diff-weekly", weeklydata);
        }

        mainWindow.webContents.send("last-sync", getTimeStamp());
        break;
    }

    setTimeout(() => {
      mainWindow.setProgressBar(-1);
    }, 500);
  } catch (error) {
    if (error.message.startsWith("no such table"))
      dialog.showMessageBox({
        type: "error",
        title: "Error Fetching Data",
        message:
          "There has been an error fetching live data and no local file could be found.",
      });
    else if (error.message.startsWith("connect"))
      dialog.showMessageBox({
        type: "error",
        title: "Connection Error",
        message:
          "There has been an error connecting to the server. Please check your internet connection.",
      });
    else console.log(error);
    e.sender.send("data-fetched");
    syncInProgress = false;
    mainWindow.setProgressBar(-1);
  } finally {
    await sftp.end();
  }
  syncInProgress = false;
});

ipcMain.on("request-dropdown-data", (e, data) => {
  switch (data) {
    case "steps":
      var data = getStepsData();
      data.type = "steps";
      break;
    case "level":
      var data = getLevelData();
      data.type = "level";
      break;
    case "npc":
      var data = getNPCData();
      data.type = "npc";
      break;
    case "pvp":
      var data = getPVPData();
      data.type = "pvp";
      break;
    default:
      return;
  }
  e.sender.send("data-live", data);
});

ipcMain.on("request-userdata-full", (e, arg) => {
  let user = {};
  if (!arg.match(/\D/)) user.id = arg;
  else user.name = arg;
  try {
    var userdata = getUserAlltimeStats(user);
  } catch (e) {
    return mainWindow.webContents.send("error", e.message);
  }
  e.sender.send("data-user-all", userdata);

  let weeklydata = getUserRecentWeeklyData(userdata);
  e.sender.send("data-diff-weekly", weeklydata);
});

ipcMain.on("request-live-steps", (e) => {
  let data = getStepsData();
  data.type = "steps";
  e.sender.send("data-live", data);
});

ipcMain.on("request-live-levels", (e) => {
  let data = getLevelData();
  data.type = "level";
  e.sender.send("data-live", data);
});

ipcMain.on("request-live-npc", (e) => {
  let data = getNPCData();
  data.type = "npc";
  e.sender.send("data-live", data);
});

ipcMain.on("request-live-pvp", (e) => {
  let data = getPVPData();
  data.type = "pvp";
  e.sender.send("data-live", data);
});

ipcMain.on("close-window", () => {
  mainWindow.close();
});

ipcMain.on("maximize-window", () => {
  mainWindow.maximize();
});

ipcMain.on("restore-window", () => {
  mainWindow.unmaximize();
});

ipcMain.on("minimize-window", () => {
  mainWindow.minimize();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  createMainWindow();

  // remove for production
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    mainWindow.webContents.toggleDevTools();
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createMainWindow();
});

// gather data
const getLinkData = () => {
  let links = db_gen.prepare(`SELECT * FROM links`).all();
  for (let i = 0; i < links.length; i++) {
    let guild = db_ud
      .prepare(`SELECT guild_id FROM UserDataLive WHERE id=${links[i].SMMO_ID}`)
      .get();
    links[i].guild = guild.guild_id;
  }
  return links;
};

const getLevelData = () => {
  let leveldata = db_ud
    .prepare(`SELECT level, name, id FROM UserDataLive`)
    .all();
  for (let i = 0; i < leveldata.length; i++) {
    // filter out all unlinked users
    let link = db_gen
      .prepare(`select Discord_ID from links where SMMO_ID=${leveldata[i].id}`)
      .get();
    if (!link) leveldata.splice(i, 1);
  }
  return leveldata;
};

const getStepsData = () => {
  let stepsdata = db_ud
    .prepare(`SELECT steps, name, id FROM UserDataLive`)
    .all();
  for (let i = 0; i < stepsdata.length; i++) {
    // filter out all unlinked users
    let link = db_gen
      .prepare(`select Discord_ID from links where SMMO_ID=${stepsdata[i].id}`)
      .get();
    if (!link) stepsdata.splice(i, 1);
  }
  return stepsdata;
};

const getNPCData = () => {
  let npcdata = db_ud.prepare(`SELECT npc, name, id FROM UserDataLive`).all();
  for (let i = 0; i < npcdata.length; i++) {
    // filter out all unlinked users
    let link = db_gen
      .prepare(`select Discord_ID from links where SMMO_ID=${npcdata[i].id}`)
      .get();
    if (!link) npcdata.splice(i, 1);
  }
  return npcdata;
};

const getPVPData = () => {
  let pvpdata = db_ud.prepare(`SELECT pvp, name, id FROM UserDataLive`).all();
  for (let i = 0; i < pvpdata.length; i++) {
    // filter out all unlinked users
    let link = db_gen
      .prepare(`select Discord_ID from links where SMMO_ID=${pvpdata[i].id}`)
      .get();
    if (!link) pvpdata.splice(i, 1);
  }
  return pvpdata;
};

const getUserAlltimeStats = (user) => {
  if (user.id)
    var linkdata = db_gen
      .prepare(`SELECT * FROM links WHERE SMMO_ID=?`)
      .get(user.id);
  else {
    var linkdata = db_ud
      .prepare(`SELECT * FROM UserDataLive WHERE name LIKE '%${user.name}%'`)
      .get();
    if (linkdata) user.id = `${linkdata.id}`;
  }
  if (!linkdata) {
    dialog.showMessageBox({
      type: "error",
      title: "Unlinked",
      message: `There is no user in the database with the ${
        user.id ? "ID" : "name"
      } ${user.id ? user.id : user.name}.`,
    });
  }

  let linkedsince = db_gen
    .prepare(`SELECT * FROM linkedsince WHERE id=?`)
    .get(user.id);
  if (!linkedsince) throw new Error("no linked date");
  let date = linkedsince.date;

  let dataset = {
    steps: [],
    levels: [],
    npc: [],
    pvp: [],
    quests: [],
    tasks: [],
    bosses: [],
    bounties: [],
    dates: [],
    name: "",
  };

  while (
    helper.getEarliestDate([date, helper.getToday()]) === date &&
    date !== helper.getToday()
  ) {
    try {
      var data_now = db_ud
        .prepare(`SELECT * FROM ud${date.replace(/\-/g, "_")} WHERE id=?`)
        .get(user.id);
    } catch (e) {
      if (e.message.startsWith("no such table")) break;
      else console.log(e);
    }
    if (data_now) {
      dataset.levels.push(data_now.level);
      dataset.steps.push(data_now.steps);
      dataset.npc.push(data_now.npc);
      dataset.pvp.push(data_now.pvp);
      dataset.quests.push(data_now.quests);
      dataset.tasks.push(data_now.tasks);
      dataset.bosses.push(data_now.bosses);
      dataset.bounties.push(data_now.bounties);
      dataset.dates.push(date);
      dataset.name = data_now.name;
    }
    date = helper.getTomorrow(date);
  }

  return dataset;
};

const getTimeStamp = () => {
  if (!fs.existsSync("./data/lastrefresh.json")) return;
  let file = JSON.parse(fs.readFileSync("./data/lastrefresh.json"));
  let now = Math.floor(new Date() / 1000);
  let timeDifference = Math.floor(now - file.stamp);

  var months = Math.floor(timeDifference / (30 * 24 * 60 * 60));
  timeDifference -= months * 30 * 24 * 60 * 60;

  var weeks = Math.floor(timeDifference / (7 * 24 * 60 * 60));
  timeDifference -= weeks * 7 * 24 * 60 * 60;

  var days = Math.floor(timeDifference / (24 * 60 * 60));
  timeDifference -= days * 24 * 60 * 60;

  var hours = Math.floor(timeDifference / (60 * 60));
  timeDifference -= hours * 60 * 60;

  var minutes = Math.floor(timeDifference / 60);

  let values = [months, weeks, days, hours, minutes];
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== 0) {
      switch (i) {
        case 0:
          return `${values[i]} ${values[i] > 1 ? `Months` : `Month`} ago`;
        case 1:
          return `${values[i]} ${values[i] > 1 ? `Weeks` : `Week`} ago`;
        case 2:
          return `${values[i]} ${values[i] > 1 ? `Days` : `Day`} ago`;
        case 3:
          return `${values[i]} ${values[i] > 1 ? `Hours` : `Hour`} ago`;
        case 4:
          return `${values[i]} ${values[i] > 1 ? `Minutes` : `Minute`} ago`;
        default:
          return "Just Now";
      }
    }
  }
  return "Just Now";
};

const getUserRecentWeeklyData = (userdata) => {
  let weeklydata = {
    week1: {
      steps: [],
      levels: [],
      npc: [],
      pvp: [],
      quests: [],
      tasks: [],
      bosses: [],
      bounties: [],
      dates: [],
    },
    week2: {
      steps: [],
      levels: [],
      npc: [],
      pvp: [],
      quests: [],
      tasks: [],
      bosses: [],
      bounties: [],
      dates: [],
    },
    name: userdata.name,
  };

  for (let i = userdata.dates.length - 1; i >= 0; i--) {
    if (weeklydata.week2.dates.length < 7) {
      weeklydata.week2.levels.unshift(userdata.levels[i]);
      weeklydata.week2.steps.unshift(userdata.steps[i]);
      weeklydata.week2.npc.unshift(userdata.npc[i]);
      weeklydata.week2.pvp.unshift(userdata.pvp[i]);
      weeklydata.week2.quests.unshift(userdata.quests[i]);
      weeklydata.week2.tasks.unshift(userdata.tasks[i]);
      weeklydata.week2.bosses.unshift(userdata.bosses[i]);
      weeklydata.week2.bounties.unshift(userdata.bounties[i]);
      weeklydata.week2.dates.unshift(userdata.dates[i]);
    } else if (weeklydata.week1.dates.length < 7) {
      weeklydata.week1.levels.unshift(userdata.levels[i]);
      weeklydata.week1.steps.unshift(userdata.steps[i]);
      weeklydata.week1.npc.unshift(userdata.npc[i]);
      weeklydata.week1.pvp.unshift(userdata.pvp[i]);
      weeklydata.week1.quests.unshift(userdata.quests[i]);
      weeklydata.week1.tasks.unshift(userdata.tasks[i]);
      weeklydata.week1.bosses.unshift(userdata.bosses[i]);
      weeklydata.week1.bounties.unshift(userdata.bounties[i]);
      weeklydata.week1.dates.unshift(userdata.dates[i]);
    } else i = -1;
  }
  return weeklydata;
};

const getWarData = () => db_gen.prepare(`SELECT * FROM wars`).all();
