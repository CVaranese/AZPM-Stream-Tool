AZPM STREAM TOOL
Project+ Stream Tool with the AZPM overlays on top.

WHAT IS IN HERE
- Project+ Stream Tool exe: fill in players, characters, score, round and casters, then press Update.
- VS Screen.html          AZPM VS screen (also used for thumbnails). Works for singles and doubles.
- AZPM Singles.html       game layout for singles and doubles: game on the left, cam and casters
                          on the right. The score shows as ticks that fill with the team colour.
                          The game area is 1310x1080 (left edge to x 1310), the game's own shape.
- AZPM Doubles.html       older 1-cam layout: cam and casters on the left, game on the right.
- AZPM Commentary.html    commentator names on a bottom bar.
- copytitle.bat           copies a VOD title for the current match to the clipboard.
- Resources/AZPM/OBS Transitions   stinger transitions (Swoosh, Game In).
The stock overlays (16.9 Scoreboard, 4.3 Scoreboard, Bracket) still work as usual.

INSTALLING
1. Unzip the whole folder somewhere it can stay (for example Documents\AZPM Stream Tool).
   Do not run it from inside the zip. Keep the files together: the html files need the
   Resources folder next to them.
2. Open "Project+ Stream Tool 2.3.0.exe". Windows may warn about an unknown app:
   "More info" > "Run anyway". The first start takes a few seconds.
3. Fill in a test match (two players and characters) and press UPDATE.
4. Set up OBS (below). The exe has to stay open while streaming.

Updating from an older AZPM Stream Tool: unzip the new one into a new folder, then in OBS
point every browser source at the new folder's html files (Properties > Browse) and press
"Refresh cache of current page" in each. To keep your player and commentator presets, copy
the old Resources/Texts/Player Info and Resources/Texts/Commentator Info folders over.

SETTING UP OBS
OBS canvas: Settings > Video > Base (Canvas) Resolution 1920x1080.

Adding an overlay (do this for each html file you use):
- Sources > + > Browser. Tick "Local file" and pick the html file from the tool's folder.
- Width 1920, Height 1080.
- Tick "Refresh browser when scene becomes active".
  "Shutdown source when not visible" saves resources if you want it.
- If the overlay shows "Can't connect with GUI" in the bottom left corner, the exe is not open.

Suggested scenes:
- VS / Thumbnail scene: one browser source, VS Screen.html.
- Game scene: browser source AZPM Singles.html on top, the game capture (Dolphin window
  capture or capture card) below it, placed in the game area on the left (x 0 to 1310,
  full height). Put your webcam below the overlay, lined up with the cam box on the right.
  Use AZPM Doubles.html instead for the older 1-cam layout (game on the right).
- Commentary scene: your cams plus a browser source AZPM Commentary.html on top.
Order in the Sources list: the overlay must be ABOVE the game and cam sources.

Stinger transitions: see TRANSITIONS below.

DOUBLES
- Set the gamemode to doubles in the Stream Tool and fill in all four players.
  The game layouts and the VS screen show each team as "Player & Player".
  Tags and pronouns are only shown in singles.
- The old way also works: stay in singles mode and type both names in one player slot.

VOD TITLES
- Double click copytitle.bat while the Stream Tool is open. It copies, for example:
    AZPM Weekly #100 - Winners Finals - Player One (Captain Falcon) VS Player Two (Marth)
- A Random character shows the team colour instead of a character.

VOD THUMBNAILS
- In the Stream Tool: Settings > "Export thumbnail". It takes a picture of the VS Screen
  with the info of the last Update (press Update first) and saves a 1280x720 PNG in the
  "Thumbnails" folder next to the exe, named like the VOD title. Takes about a second.
- "Open thumbnails folder" opens that folder.

TRANSITIONS
- In OBS add a Stinger transition, pick a file from Resources/AZPM/OBS Transitions
  and set the transition point to 350 ms.
- Swoosh works well as the default; Game In as a transition override on the game scenes
  (right click the scene, Transition Override).

CHANGING LOGOS AND TIMINGS
- Logos of the slideshow: put the image in Resources/AZPM/Overlay/Game Layouts/Logos
  and add it to the list in Resources/AZPM/Scripts/Config.mjs (open it with Notepad).
- The same file has the time each logo and each caster social stays on screen.

Old AZPM overlays by @jumbaloni. Stream Tool by Readek and ilikepizza107.
