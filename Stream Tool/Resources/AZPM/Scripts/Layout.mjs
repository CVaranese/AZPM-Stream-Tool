// Shared script of the AZPM game layouts (AZPM Singles / Doubles / Commentary).
//
// It listens to the same "gameData" the stock scoreboards get from the GUI and
// fills whatever elements the page has. A page only needs to contain the
// elements it wants to show:
//
//   #p1Wrapper / #p2Wrapper   holding #pNTag, #pNName, #pNPron (tag and pron optional)
//   #p1Score / #p2Score       numeric score
//   #p1Ticks / #p2Ticks       holding .scoreTick elements, one filled per game won
//   #p1Color / #p2Color       box filled with the team colour
//   #p1Icon  / #p2Icon        <img> for the character stock icon
//   #round, #bestOf, #tournament
//   #caster1 / #caster2       holding #casterNName, #casterNSocial (icon + text)
//   #sponsorBox               logo slideshow (see Config.mjs)
//
// Text sizes come from the "data-size" attribute of each text element (px);
// text that does not fit its box shrinks until it does.

import { initWebsocket } from "../../Scripts/Utils/WebSocket.mjs";
import { resizeText } from "../../Scripts/Utils/Resize Text.mjs";
import {
    sponsorLogos, sponsorInterval, socialInterval, socialOrder,
    fadeInTime, fadeOutTime,
} from "./Config.mjs";

const byId = (id) => document.getElementById(id);
const sleep = (seconds) => new Promise((r) => setTimeout(r, seconds * 1000));

/** Last value shown by each element, to only animate real changes */
const shown = new Map();

let firstUpdate = true;

initWebsocket("gameData", (data) => update(data));
startSponsors();


/**
 * Updates everything the page has an element for
 * @param {Object} data - Game data sent by the GUI
 */
function update(data) {

    const dubs = data.gamemode == 2;

    for (let side = 0; side < 2; side++) {

        const n = side + 1;

        // in doubles, players 1 and 3 are the left team and 2 and 4 the right team
        const team = (dubs ? [data.player[side], data.player[side + 2]] : [data.player[side]])
            .filter((p) => p && p.name);
        const solo = team.length == 1 && !dubs ? team[0] : null;

        // "name" or "name & name"; tag and pronouns only make sense for one player
        change(byId(`p${n}Wrapper`), JSON.stringify(team.map((p) => [p.tag, p.name, p.pronouns])), () => {
            setSizedText(byId(`p${n}Name`), team.map((p) => p.name).join(" & "));
            setSizedText(byId(`p${n}Tag`), solo ? solo.tag : "");
            setSizedText(byId(`p${n}Pron`), solo ? solo.pronouns : "");
            resizeText(byId(`p${n}Wrapper`));
        });

        change(byId(`p${n}Score`), String(data.score[side]), (el, value) => {
            el.textContent = value;
        });

        const colorEl = byId(`p${n}Color`);
        if (colorEl) colorEl.style.backgroundColor = data.color[side].hex;

        // team colours for the css: var(--colorL) and var(--colorR)
        document.body.style.setProperty(side ? "--colorR" : "--colorL", data.color[side].hex);

        updateTicks(byId(`p${n}Ticks`), data.score[side], data.color[side].hex, data.bestOf);

        // stock icon of the character, singles only
        const p = data.player[side];
        const iconSrc = (!dubs && p && p.char && p.skin)
            ? `Resources/Characters/${p.char}/Icons/${p.skin}.png` : "";
        change(byId(`p${n}Icon`), iconSrc, (el, value) => {
            el.style.visibility = value ? "visible" : "hidden";
            el.onerror = () => { el.style.visibility = "hidden"; }; // custom skins have no icon
            if (value) el.src = value;
        });

    }

    changeText(byId("round"), data.round);
    changeText(byId("tournament"), data.tournamentName);

    // "Best of 5", or "Bo5" if the element has data-format="short"
    const bo = /^Bo(\d+)$/.exec(data.bestOf || "");
    const bestOfEl = byId("bestOf");
    const shortBo = bestOfEl && bestOfEl.dataset.format == "short";
    changeText(bestOfEl, bo ? (shortBo ? data.bestOf : `Best of ${bo[1]}`) : "");

    for (let i = 0; i < data.caster.length; i++) {
        updateCaster(i + 1, data.caster[i]);
    }

    firstUpdate = false;

}


/**
 * Runs an update on an element only if its value changed, fading it out and back in
 * @param {HTMLElement} el - Element to update (does nothing if the page doesn't have it)
 * @param {String} value - Value to compare against the last one shown
 * @param {(el: HTMLElement, value: String) => void} apply - Does the actual update
 */
async function change(el, value, apply) {

    if (!el || shown.get(el) === value) return;
    shown.set(el, value);

    if (!firstUpdate) {
        el.style.transition = `opacity ${fadeOutTime}s`;
        el.style.opacity = 0;
        await sleep(fadeOutTime);
        // if another change came in while fading, let that one finish the job
        if (shown.get(el) !== value) return;
    }

    apply(el, value);

    el.style.transition = `opacity ${fadeInTime}s`;
    el.style.opacity = 1;

}

/** Fading text change for a simple text element */
function changeText(el, text) {
    change(el, text || "", (el, value) => {
        setSizedText(el, value);
        resizeText(el);
    });
}

/** Sets text at the element's full size ("data-size", px), ready to be shrunk to fit */
function setSizedText(el, text) {
    if (!el) return;
    if (el.dataset.size) el.style.fontSize = el.dataset.size + "px";
    el.textContent = text || "";
    el.style.display = text ? "" : "none";
}


// ---------- score ticks ----------

/** Colour of a score tick that has not been won yet */
const emptyTickColor = "#081c54";

/**
 * Fills one tick per game won with the team colour. The box holds ".scoreTick"
 * elements, first game first. Only as many ticks as games needed to win the set
 * are shown (2 for a Bo3, 3 for a Bo5).
 * @param {HTMLElement} box - Element holding the ticks (does nothing if the page doesn't have it)
 * @param {Number} score - Games won
 * @param {String} color - Team colour (hex)
 * @param {String} bestOf - "Bo3", "Bo5"...
 */
function updateTicks(box, score, color, bestOf) {

    if (!box) return;

    const ticks = box.getElementsByClassName("scoreTick");
    const bo = /^Bo(\d+)$/.exec(bestOf || "");
    const needed = bo ? Math.ceil(Number(bo[1]) / 2) : ticks.length;

    for (let i = 0; i < ticks.length; i++) {

        ticks[i].style.opacity = i < needed ? 1 : 0;

        const fill = i < score ? color : emptyTickColor;
        const shape = ticks[i].querySelector("polygon");
        if (shown.get(shape) === fill) continue;
        shown.set(shape, fill);

        if (firstUpdate) {
            shape.style.fill = fill;
        } else { // flash white, then settle on the new colour
            shape.style.transition = `fill ${fadeInTime}s`;
            shape.style.fill = "#ffffff";
            setTimeout(() => {
                if (shown.get(shape) === fill) shape.style.fill = fill;
            }, fadeInTime * 1000);
        }

    }

}


// ---------- casters ----------

/** Socials currently available for each caster, and which one is showing */
const casterSocials = {};

/**
 * @param {Number} n - Caster number, starting at 1
 * @param {Object} caster - Caster data from the GUI
 */
function updateCaster(n, caster) {

    const box = byId(`caster${n}`);
    if (!box) return;

    // an empty caster slot hides its whole box contents
    box.classList.toggle("casterEmpty", !caster.name);

    changeText(byId(`caster${n}Name`), caster.name);

    const socials = socialOrder
        .filter((type) => caster.socials && caster.socials[type])
        .map((type) => ({ type, text: caster.socials[type] }));

    const state = casterSocials[n] || (casterSocials[n] = { index: 0 });
    const key = JSON.stringify(socials);
    if (state.key != key) {
        state.key = key;
        state.list = socials;
        state.index = 0;
        showSocial(n);
    }

}

/** Displays the current social of a caster */
function showSocial(n) {

    const state = casterSocials[n];
    const social = state.list[state.index];

    change(byId(`caster${n}Social`), social ? social.type + social.text : "", (el) => {
        el.style.visibility = social ? "visible" : "hidden";
        if (!social) return;
        el.dataset.type = social.type; // the css picks the icon from this
        const textEl = el.querySelector(".socialText");
        setSizedText(textEl, social.text);
        resizeText(textEl);
    });

}

// rotate between each caster's socials
setInterval(() => {
    for (const n in casterSocials) {
        const state = casterSocials[n];
        if (state.list.length > 1) {
            state.index = (state.index + 1) % state.list.length;
            showSocial(n);
        }
    }
}, socialInterval);


// ---------- logo slideshow ----------

function startSponsors() {

    const box = byId("sponsorBox");
    if (!box || !sponsorLogos.length) return;

    const imgs = sponsorLogos.map((src) => {
        const img = document.createElement("img");
        img.src = src;
        img.className = "sponsor";
        img.alt = "";
        box.append(img);
        return img;
    });

    let index = 0;
    imgs[0].style.opacity = 1;

    if (imgs.length < 2) return;

    setInterval(async () => {
        imgs[index].style.opacity = 0;
        await sleep(fadeOutTime);
        index = (index + 1) % imgs.length;
        imgs[index].style.opacity = 1;
    }, sponsorInterval);

}
