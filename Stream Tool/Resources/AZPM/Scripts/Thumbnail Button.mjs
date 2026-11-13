// AZPM: "Export thumbnail" button in the GUI settings.
// The picture itself is taken by the exe (Resources/AZPM/Scripts/Thumbnail.js).
import { inside } from "../../Scripts/GUI/Globals.mjs";
import { displayNotif } from "../../Scripts/GUI/Notifications.mjs";

const section = document.getElementById("azpmThumbnailSection");
const button = document.getElementById("azpmThumbnail");
const folderButton = document.getElementById("azpmThumbnailFolder");

if (!inside.electron) {

    // the remote GUI (browser) can't take pictures
    section.style.display = "none";

} else {

    const ipc = require('electron').ipcRenderer;
    const label = button.innerHTML;

    button.addEventListener("click", async () => {
        button.disabled = true;
        button.innerHTML = "Taking picture...";
        try {
            const result = await ipc.invoke("azpmThumbnail");
            if (result.error) {
                displayNotif("Thumbnail: " + result.error);
            } else {
                displayNotif("Thumbnail saved: " + result.name);
            }
        } catch (e) {
            // the exe's ipc handler is missing (Executable.js without the AZPM line)
            displayNotif("Thumbnail export is not available");
            console.log(e);
        }
        button.innerHTML = label;
        button.disabled = false;
    });

    folderButton.addEventListener("click", () => {
        ipc.send("azpmOpenThumbnails");
    });

}
