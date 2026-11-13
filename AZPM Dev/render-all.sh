#!/usr/bin/env bash
# Renders every AZPM overlay to "AZPM Dev/renders/new-*.png" without the GUI exe.
# Run from Git Bash:  bash "AZPM Dev/render-all.sh"
# Needs Node 22+ and Chrome (path in capture.js). Port 8080 must be free,
# so close the Stream Tool GUI first.
cd "$(dirname "$0")" || exit 1

render() { # <data.json> <page> <out.png> [waitMs]
    node serve.js "../Stream Tool" "$1" 8080 > /dev/null 2>&1 &
    local server=$!
    sleep 1
    node capture.js "http://127.0.0.1:8080/$2" "renders/$3" "${4:-4000}" | grep -v "favicon\|Flags/.svg"
    kill $server
}

render sample.json           "VS%20Screen.html"        new-vs-singles.png 6000
render sample-dubs.json      "VS%20Screen.html"        new-vs-doubles.png 6000
render sample-old-match.json "AZPM%20Singles.html"     new-singles.png
render sample-old-match.json "AZPM%20Doubles.html"     new-doubles.png
render sample-dubs.json      "AZPM%20Doubles.html"     new-doubles-4players.png
render sample-old-match.json "AZPM%20Commentary.html"  new-commentary.png
