// ===================== Echofy Player – Fully Commented =====================
// This JS handles:
// 1. Loading songs from a central songs.json
// 2. Rendering playlists
// 3. Play/Pause/Next/Previous controls
// 4. Volume and seekbar
// 5. Search functionality
// 6. Album card click events
// 7. Song name scrolling animation
// 8. Compatible with static hosting (Netlify/GitHub Pages/Vercel)

// ===================== LOG START =====================
console.log("Echofy Player: JS Loaded");

// ===================== DOM REFERENCES =====================
// These are references to HTML elements. 
// It makes JS cleaner and faster to manipulate the UI
const audio = new Audio(); // core audio object
audio.preload = "metadata"; // preloads metadata like duration for smooth playback

// Player controls
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

// Song info display
const songInfoScroll = document.querySelector(".songname-scroll"); // scrolling song name
const songInfoContainer = document.querySelector(".songinfo");     // container for scrolling

// Playlist and search
const searchBar = document.querySelector(".search-bar");
const playlistUL = document.querySelector(".SongList ul");

// Seekbar and timer
const seekbar = document.querySelector(".seekbar");
const seekCircle = document.querySelector(".seekbar .circle");
const songTimer = document.querySelector(".song-timer");

// Volume control
const volumeInput = document.querySelector(".range input");

// Sidebar / hamburger menu
const hamburger = document.querySelector(".hamburger");
const closeBtn = document.querySelector(".close");
const leftSidebar = document.querySelector(".left");

// ===================== PLAYER STATE VARIABLES =====================
let songs = [];             // All songs loaded from a folder
let filteredSongs = [];     // Songs filtered via search
let currentIndex = 0;       // Index of current song
let isPlaying = false;      // Is audio currently playing
let isDragging = false;     // Is user dragging the seekbar
const cachedPlaylists = {}; // Cache loaded playlists to avoid repeated fetches

// ===================== FETCH SONGS FROM songs.json =====================
/*
  This function loads songs for a given folder (album).
  1. Checks if the folder is already cached.
  2. If not, fetches central songs.json (static JSON file in SONGS folder).
  3. Filters songs for the selected folder and stores in cache.
  4. Returns an array of song objects: { href: path to MP3, name: filename }
*/
async function getSongs(folder = "Saiyaara") {
  // Return from cache if already loaded
  if (cachedPlaylists[folder]) return cachedPlaylists[folder];

  try {
    // Fetch the central songs.json file
    const res = await fetch("SONGS/songs.json");
    if (!res.ok) throw new Error(`Failed to fetch songs.json: ${res.status}`);

    const allSongs = await res.json();

    // Map song file names to full paths
    const files = (allSongs[folder] || []).map(file => `SONGS/${folder}/${file}`);

    // Store in cache as objects with href and name
    cachedPlaylists[folder] = files.map(file => ({
      href: file,
      name: file.split("/").pop()
    }));

    return cachedPlaylists[folder];
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ===================== UPDATE SCROLLING SONG NAME =====================
/*
  If the song name is wider than its container, scrolls it horizontally.
  Animation speed is proportional to scroll width.
*/
function updateSongName(name) {
  songInfoScroll.textContent = name;
  songInfoScroll.style.animation = "none"; // reset animation

  const scrollWidth = songInfoScroll.scrollWidth;
  const containerWidth = songInfoContainer.clientWidth;

  if (scrollWidth > containerWidth) {
    const duration = scrollWidth / 40; // adjust scroll speed here
    songInfoScroll.style.animation = `scroll-name ${duration}s linear infinite`;
  }
}

// ===================== FORMAT TIME =====================
/*
  Converts seconds to mm:ss format for display
*/
function formatTime(sec) {
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

// ===================== UPDATE SEEKBAR & TIMER =====================
function updateSeekbar() {
  if (!isDragging && audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    seekCircle.style.left = `${percent}%`; // move the circle
    updateTimer();
  }
}

function updateTimer() {
  const current = formatTime(audio.currentTime);
  const total = formatTime(audio.duration || 0);
  songTimer.textContent = `${current} / ${total}`;
}

// ===================== PLAY SONG =====================
/*
  Plays song at the given index from filteredSongs array
  Updates UI: play button icon, song name scroll
  Handles autoplay restrictions gracefully
*/
async function playSong(index) {
  currentIndex = index;
  audio.src = filteredSongs[currentIndex].href;

  try {
    await audio.play();
    isPlaying = true;
    playBtn.src = "./Assets/pause.svg"; // change to pause icon
    updateSongName(filteredSongs[currentIndex].name);
  } catch (err) {
    console.warn("Autoplay prevented:", err);
  }
}

// ===================== TOGGLE PLAY / PAUSE =====================
function togglePlay() {
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
    playBtn.src = "./Assets/play.svg"; // show play icon
  } else {
    audio.play();
    isPlaying = true;
    playBtn.src = "./Assets/pause.svg"; // show pause icon
  }
}

// ===================== NEXT / PREVIOUS SONG =====================
function nextSong() {
  if (filteredSongs.length === 0) return;
  currentIndex = (currentIndex + 1) % filteredSongs.length;
  playSong(currentIndex);
}

function prevSong() {
  if (filteredSongs.length === 0) return;
  currentIndex = (currentIndex - 1 + filteredSongs.length) % filteredSongs.length;
  playSong(currentIndex);
}

// ===================== RENDER PLAYLIST =====================
/*
  Displays list of songs in the playlist UL
  Handles empty search results gracefully
*/
function renderPlaylist(list) {
  filteredSongs = list;

  if (list.length === 0) {
    playlistUL.innerHTML = `<li class="no-results">No results found</li>`;
  } else {
    playlistUL.innerHTML = list
      .map((s) => `<li data-href="${s.href}" data-name="${s.name}">${s.name}</li>`)
      .join("");
  }
}

// ===================== PLAYLIST CLICK HANDLER =====================
playlistUL.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li || li.classList.contains("no-results")) return;
  const index = Array.from(playlistUL.children).indexOf(li);
  playSong(index);
});

// ===================== SEARCH FUNCTIONALITY =====================
searchBar.addEventListener("input", () => {
  const query = searchBar.value.toLowerCase();
  const filtered = songs.filter((s) => s.name.toLowerCase().includes(query));
  renderPlaylist(filtered);
  currentIndex = 0; // reset currentIndex for search results
});

// ===================== SEEKBAR DRAG =====================
seekbar.addEventListener("mousedown", (e) => { isDragging = true; seekTo(e); });
window.addEventListener("mousemove", (e) => { if (isDragging) seekTo(e); });
window.addEventListener("mouseup", () => { isDragging = false; });

function seekTo(e) {
  const rect = seekbar.getBoundingClientRect();
  const percent = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
  audio.currentTime = percent * audio.duration;
  seekCircle.style.left = `${percent * 100}%`;
  updateTimer();
}

// ===================== VOLUME CONTROL =====================
volumeInput.addEventListener("change", (e) => {
  audio.volume = parseFloat(e.target.value) / 100; // input value 0-100 mapped to 0-1
});

// ===================== ALBUM CARD CLICK HANDLER =====================
document.querySelectorAll(".card .play").forEach((btn) => {
  btn.addEventListener("click", async (event) => {
    event.stopPropagation();
    const card = event.target.closest(".card");
    const folder = card.dataset.folder;

    console.log("Play clicked for folder:", folder);

    songs = await getSongs(folder);
    renderPlaylist(songs);
    if (songs.length > 0) playSong(0);
  });
});

// ===================== HAMBURGER / SIDEBAR =====================
hamburger.addEventListener("click", () => leftSidebar.classList.toggle("show"));
closeBtn.addEventListener("click", () => leftSidebar.classList.remove("show"));

// ===================== AUDIO EVENTS =====================
audio.addEventListener("timeupdate", updateSeekbar);
audio.addEventListener("ended", nextSong);

// ===================== BUTTON EVENT LISTENERS =====================
playBtn.addEventListener("click", togglePlay);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

// ===================== INITIALIZE PLAYER =====================
(async () => {
  songs = await getSongs("Saiyaara"); // default folder
  renderPlaylist(songs);
  if (songs.length > 0) playSong(0); // autoplay first song
})();
