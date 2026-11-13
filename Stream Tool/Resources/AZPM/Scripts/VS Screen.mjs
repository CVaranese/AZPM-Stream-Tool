// AZPM additions to the VS Screen. Called from Resources/Scripts/VS Screen.js
// with the same data object the stock modules get.

import { resizeText } from "../../Scripts/Utils/Resize Text.mjs";

// text under each side's names: character (singles) or team name (doubles)
const subTextEls = [
    document.getElementById("p1CharName"),
    document.getElementById("p2CharName"),
];

// "player & player" line of each side, doubles only
const dubsNamesEls = [
    document.getElementById("azpmDubsNamesL"),
    document.getElementById("azpmDubsNamesR"),
];

const dubsNamesSize = 80; // px, shrinks to fit

/**
 * Updates the AZPM-only elements of the VS Screen
 * @param {Object} data - Game data sent by the GUI
 */
export function updateAzpmVs(data) {

    const dubs = data.gamemode == 2;

    // lets the css tell singles and doubles apart
    document.body.classList.toggle("azpmDubs", dubs);

    for (let side = 0; side < 2; side++) {

        if (dubs) {

            // players 1 and 3 are the left team, 2 and 4 the right team
            const el = dubsNamesEls[side];
            el.replaceChildren();
            const team = [data.player[side], data.player[side + 2]]
                .filter((p) => p && p.name);
            team.forEach((p, i) => {
                if (i > 0) el.append(textSpan("&", "azpmDubsAnd"));
                if (p.tag) el.append(textSpan(p.tag, "azpmDubsTag"));
                el.append(textSpan(p.name));
            });
            for (const child of el.children) {
                child.style.fontSize = (child.className == "azpmDubsTag"
                    ? dubsNamesSize / 2 : dubsNamesSize) + "px";
            }
            resizeText(el);

            subTextEls[side].textContent = data.teamName[side] || "";

        } else {

            const p = data.player[side];
            subTextEls[side].textContent = (p && p.char) ? p.char : "";

        }

    }

}

/**
 * @param {String} text
 * @param {String} className
 * @returns {HTMLSpanElement}
 */
function textSpan(text, className = "") {
    const span = document.createElement("span");
    span.textContent = text;
    span.className = className;
    return span;
}
