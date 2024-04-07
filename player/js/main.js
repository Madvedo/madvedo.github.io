const player = document.querySelector(".player"),
  playBtn = document.querySelector(".play"),
  prevBtn = document.querySelector(".prev"),
  nextBtn = document.querySelector(".next"),
  audio = document.querySelector(".audio"),
  progressContainer = document.querySelector(".progress__container"),
  progress = document.querySelector(".progress"),
  title = document.querySelector(".song"),
  cover = document.querySelector(".cover__img"),
  imgSrc = document.querySelector(".img__src");

// Названия песен
const songs = [
  "Быть Или Не Быть",
  "Иуdа",
  "Новые Силы",
  "Попса",
  "Скука",
  "Я Бы Всё Отdал",
];

// Песня по умолчанию
let songIndex = 0;

// Init
function loadSong(song) {
  title.innerHTML = song;
  audio.src = `audio/${song}.mp3`;
  cover.src = `img/Front.jpg`;
}

loadSong(songs[songIndex]);

//Play
function playSong() {
  player.classList.add("play");
  cover.classList.add("active");
  imgSrc.src = "/player/img/Pause.png";
  audio.play();
}

//Pause
function pauseSong() {
  player.classList.remove("play");
  cover.classList.remove("active");
  imgSrc.src = "/player/img/Play.png";
  audio.pause();
}
playBtn.addEventListener("click", () => {
  const isPlaying = player.classList.contains("play");
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
});
// Next song

function nextSong() {
  songIndex++;

  if (songIndex > songs.length - 1) {
    songIndex = 0;
  }
  loadSong(songs[songIndex]);
  playSong();
}
nextBtn.addEventListener("click", nextSong);

// Prev song
function prevSong() {
  songIndex--;

  if (songIndex < 0) {
    songIndex = songs.length - 1;
  }

  loadSong(songs[songIndex]);
  playSong();
}
prevBtn.addEventListener("click", prevSong);

//Progress bar

function updateProgress(e) {
  const { duration, currentTime } = e.srcElement;
  const progressPercent = (currentTime / duration) * 100;
  progress.style.width = `${progressPercent}%`;
}
audio.addEventListener("timeupdate", updateProgress);

//Set progress

function setProgress(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audio.duration;

  audio.currentTime = (clickX / width) * duration;
}
progressContainer.addEventListener("click", setProgress);

//Autoplay
audio.addEventListener("ended", nextSong);
