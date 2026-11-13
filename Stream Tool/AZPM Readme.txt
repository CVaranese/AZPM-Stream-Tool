AZPM STREAM TOOL
Project+ Stream Tool with the AZPM overlays on top.

WHAT IS IN HERE
- Project+ Stream Tool exe: fill in players, characters, score, round and casters, then press Update.
- VS Screen.html          AZPM VS screen (also used for thumbnails). Works for singles and doubles.
- AZPM Singles.html       game layout for singles: 4:3 game on the left, cam and casters on the right.
- AZPM Doubles.html       game layout for doubles: cam and casters on the left, game on the right.
- AZPM Commentary.html    commentator names on a bottom bar.
- copytitle.bat           copies a VOD title for the current match to the clipboard.
- Resources/AZPM/OBS Transitions   stinger transitions (Swoosh, Game In).
The stock overlays (16.9 Scoreboard, 4.3 Scoreboard, Bracket) still work as usual.

ADDING THE OVERLAYS TO OBS
- Drag the html file into OBS, or add a Browser source, tick "Local file" and pick the html file.
- Set the source to 1920 wide and 1080 high.
- Turn on "Refresh browser when scene becomes active".
  "Shutdown source when not visible" saves resources if you want it.
- The Stream Tool exe has to be open; the overlays get their info from it.
  With the exe closed they show "Can't connect with GUI" in the bottom left corner.

DOUBLES
- Set the gamemode to doubles in the Stream Tool and fill in all four players.
  The doubles layout and the VS screen show each team as "Player & Player".
  Tags and pronouns are not shown on the doubles layout.
- The old way also works: stay in singles mode and type both names in one player slot.

VOD TITLES
- Double click copytitle.bat while the Stream Tool is open. It copies, for example:
    AZPM Weekly #100 - Winners Finals - Player One (Captain Falcon) VS Player Two (Marth)
- A Random character shows the team colour instead of a character.

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
