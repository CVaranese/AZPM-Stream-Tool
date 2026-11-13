#!/usr/bin/env bash
# Builds the folder + zip the AZPM team uses.
#
#   bash "AZPM Dev/build-zip.sh" "<base build folder>" [version]
#
# <base build folder> is an unpacked Stream Tool build that already has the exe
# and the AZPM character set (Resources/Characters, Resources/Texts), for example
# the 2.3.0 build the AZPM team sent. Characters, texts (player presets, settings)
# and the exe are taken from it; every other file comes from this repository
# (upstream code + the AZPM layer), from the files git tracks in "Stream Tool".
#
# Result: "AZPM Dev/dist/AZPM Stream Tool <version>/" and the same name + ".zip".
set -e

base="${1:?usage: build-zip.sh <base build folder> [version]}"
version="${2:-$(date +%Y-%m-%d)}"

cd "$(dirname "$0")/.."
name="AZPM Stream Tool $version"
dist="AZPM Dev/dist"
out="$dist/$name"

if [ ! -d "$base/Resources/Characters" ]; then
    echo "No Resources/Characters in: $base" >&2
    exit 1
fi

rm -rf "$out" "$out.zip"
mkdir -p "$out"

echo "Copying the base build..."
cp -r "$base/." "$out/"

# leftovers of the first hand-made AZPM port, now in Resources/AZPM
rm -rf "$out/_dev" "$out/_original"
rm -f "$out/Resources/Overlay/VS Screen/AZPM Layer.png" \
      "$out/Resources/Overlay/VS Screen/AZPM BG.mp4" \
      "$out/Resources/Fonts/Bebas-Regular.ttf"

echo "Copying the repository files over it..."
count=0
while IFS= read -r -d '' file; do
    rel="${file#Stream Tool/}"
    case "$rel" in
        Resources/Characters/*|Resources/Texts/*) continue ;;
    esac
    mkdir -p "$out/$(dirname "$rel")"
    cp "$file" "$out/$rel"
    count=$((count + 1))
done < <(git ls-files -z -- "Stream Tool")
echo "$count files from the repository"

echo "Zipping..."
powershell -NoProfile -Command "Compress-Archive -Path '$out' -DestinationPath '$out.zip'"
ls -la "$out.zip"
