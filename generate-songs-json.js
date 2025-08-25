const fs = require("fs");
const path = require("path");

const songsFolder = path.join(__dirname, "SONGS");

// Get all album folders
const albums = fs.readdirSync(songsFolder).filter(f =>
  fs.statSync(path.join(songsFolder, f)).isDirectory()
);

const songsJson = {};

// Loop through each album folder and list MP3 files
albums.forEach(album => {
  const files = fs.readdirSync(path.join(songsFolder, album))
                  .filter(f => f.endsWith(".mp3"));
  songsJson[album] = files;
});

// Write the JSON file in SONGS folder
fs.writeFileSync(path.join(songsFolder, "songs.json"), JSON.stringify(songsJson, null, 2));

console.log("✅ songs.json created successfully!");
