// AZPM: VOD thumbnail export.
// The GUI's "Export thumbnail" button (Thumbnail Button.mjs) asks for this over ipc.
// It renders "VS Screen.html" in a hidden window with the data last sent with "Update",
// takes a picture of it and saves it as a 1280x720 PNG in "Thumbnails" next to the exe,
// named like the VOD title (same format as copytitle.ps1).
// Loaded from Resources/Scripts/Executable.js, so it runs in the exe's node side.

const { BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const WIDTH = 1280, HEIGHT = 720; // YouTube thumbnail size
const MAX_WAIT_MS = 5000; // give up waiting for the page to be ready after this

// The VS Screen intro is css animations (Utils/Fade In.mjs, "fadeIn 0.4s 0.35s both" and so on).
// Squashing them to 1 ms makes the page show its final state right away. 1 ms and not 0,
// so "animationend" (which the fade outs wait for) still fires.
const NO_INTRO_CSS = `*, *::before, *::after {
    animation-duration: 1ms !important;
    animation-delay: 0s !important;
    transition: none !important;
}`;

// null while something is still loading or animating, else a short description of the
// page state (compared between polls: the page counts as ready once it stops changing)
const READY_CHECK = `(() => {
    if (document.fonts.status !== "loaded") return null;
    const imgs = [...document.images].filter(i => i.getAttribute("src"));
    if (imgs.some(i => !i.complete)) return null;
    for (const vid of document.querySelectorAll("video")) {
        if (vid.getAttribute("src") && vid.readyState < 2) return null;
    }
    const anims = document.getAnimations();
    if (anims.some(a => a.playState === "running")) return null;
    return imgs.map(i => i.src).join("|") + "#" + anims.length + "#" + document.body.innerText.length;
})()`;

const POLL_MS = 100;
const STABLE_POLLS = 3; // same state this many polls in a row = done

let lastGameData = null;
let busy = false;

module.exports = function initThumbnail(resourcesPath) {

    const rootPath = path.resolve(resourcesPath, '..');

    // remember the game data the GUI sends to the overlays, to name the file
    ipcMain.on('sendData', (event, data) => {
        if (!data) return;
        try {
            const json = JSON.parse(data);
            if (json.id == "gameData") lastGameData = json;
        } catch (e) {}
    });

    ipcMain.handle('azpmThumbnail', async () => {
        if (busy) return { error: "Already taking a thumbnail" };
        if (!lastGameData) return { error: "Press Update first" };
        busy = true;
        try {
            const image = await capture(path.join(rootPath, "VS Screen.html"));
            const dir = path.join(rootPath, "Thumbnails");
            fs.mkdirSync(dir, { recursive: true });
            const file = uniqueFile(dir, fileName(vodTitle(lastGameData)));
            fs.writeFileSync(file, image.toPNG());
            return { file: file, name: path.basename(file) };
        } catch (e) {
            console.log(e);
            return { error: String(e && e.message || e) };
        } finally {
            busy = false;
        }
    });

    ipcMain.on('azpmOpenThumbnails', () => {
        const dir = path.join(rootPath, "Thumbnails");
        fs.mkdirSync(dir, { recursive: true });
        shell.openPath(dir);
    });

}

/** Loads the page offscreen, waits for it to settle and returns a WIDTHxHEIGHT image */
async function capture(pagePath) {

    // A 1920x1080 window gets clamped to the screen height on a 1080p monitor, which
    // squashes the page. So the window is 1280x720 and the page is zoomed to 2/3:
    // it still lays out at 1920x1080 css pixels.
    const win = new BrowserWindow({
        show: false,
        width: WIDTH,
        height: HEIGHT,
        useContentSize: true,
        frame: false,
        webPreferences: {
            offscreen: true,
            backgroundThrottling: false,
            zoomFactor: WIDTH / 1920
        }
    });

    try {
        win.webContents.setAudioMuted(true);
        win.webContents.once("dom-ready", () => {
            win.webContents.insertCSS(NO_INTRO_CSS);
        });
        // when the page's websocket connects, the GUI sends it the match data
        const dataSent = nextGameDataSend(MAX_WAIT_MS);
        await win.loadFile(pagePath);
        win.webContents.setZoomFactor(WIDTH / 1920);
        await dataSent;
        await waitReady(win, MAX_WAIT_MS);
        const image = await win.webContents.capturePage();
        if (image.isEmpty()) throw new Error("The VS Screen picture came out empty");
        return image.resize({ width: WIDTH, height: HEIGHT, quality: "best" });
    } finally {
        win.destroy();
    }

}

/** Resolves on the next game data the GUI sends to the overlays, or after ms */
function nextGameDataSend(ms) {
    return new Promise(resolve => {
        const done = () => {
            clearTimeout(timer);
            ipcMain.removeListener('sendData', listener);
            resolve();
        };
        const listener = (event, data) => {
            if (data && String(data).includes('"gameData"')) done();
        };
        const timer = setTimeout(done, ms);
        ipcMain.on('sendData', listener);
    });
}

/** Polls the page until it stops changing (see READY_CHECK), or until ms passed */
async function waitReady(win, ms) {
    const end = Date.now() + ms;
    let last = null, same = 0;
    while (Date.now() < end) {
        await new Promise(r => setTimeout(r, POLL_MS));
        const state = await win.webContents.executeJavaScript(READY_CHECK).catch(() => null);
        if (state !== null && state === last) {
            if (++same >= STABLE_POLLS) return;
        } else {
            same = 0;
        }
        last = state;
    }
}

/** "Name (Character)" for one side; Random shows the team colour, CPU shows nothing */
function formatSide(data, side) {
    let players = [data.player[side]];
    if (data.gamemode == 2) players.push(data.player[side + 2]);
    players = players.filter(p => p && p.name);

    const names = players.map(p => p.name).join(" & ");
    const chars = [...new Set(players.map(p => {
        if (p.char == "Random") return data.color && data.color[side] ? data.color[side].name : "";
        if (p.char != "CPU") return p.char;
        return "";
    }).filter(c => c))];

    return chars.length ? `${names} (${chars.join(", ")})` : names;
}

/** Tournament - Round - Player One (Character) VS Player Two (Character), blanks left out */
function vodTitle(data) {
    return [data.tournamentName, data.round, `${formatSide(data, 0)} VS ${formatSide(data, 1)}`]
        .filter(t => t && t.trim() && t.trim() != "VS").join(" - ");
}

/** Removes what Windows does not allow in a file name */
function fileName(title) {
    let name = title.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").replace(/\s+/g, " ").trim();
    name = name.replace(/[. ]+$/, "").substring(0, 150);
    return name || "Thumbnail";
}

/** "name.png", or "name (2).png" and so on when it already exists */
function uniqueFile(dir, name) {
    let file = path.join(dir, name + ".png");
    for (let i = 2; fs.existsSync(file); i++) {
        file = path.join(dir, `${name} (${i}).png`);
    }
    return file;
}
