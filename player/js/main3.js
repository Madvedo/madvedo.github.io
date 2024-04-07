const player3 = document.querySelector(".player3"),
  playBtn3 = document.querySelector(".play3"),
  prevBtn3 = document.querySelector(".prev3"),
  nextBtn3 = document.querySelector(".next3"),
  audio3 = document.querySelector(".audio3"),
  progressContainer3 = document.querySelector(".progress__container3"),
  progress3 = document.querySelector(".progress3"),
  title3 = document.querySelector(".song3"),
  cover3 = document.querySelector(".cover__img3"),
  imgSrc3 = document.querySelector(".img__src3");

// Названия песен
const songs3 = ["Нить"];

// Песня по умолчанию
let songIndex3 = 0;

// Init
function loadSong3(song3) {
  title3.innerHTML = song3;
  audio3.src = `audio/${song3}.wav`;
  cover3.src = `/img/cover-nit.jpg`;
}

loadSong3(songs3[songIndex3]);

//Play
function playSong3() {
  player3.classList.add("play3");
  cover3.classList.add("active");
  imgSrc3.src = "/player/img/Pause.png";
  audio3.play();
}

//Pause
function pauseSong3() {
  player3.classList.remove("play3");
  cover3.classList.remove("active");
  imgSrc3.src = "/player/img/Play.png";
  audio3.pause();
}
playBtn3.addEventListener("click", () => {
  const isPlaying3 = player3.classList.contains("play3");
  if (isPlaying3) {
    pauseSong3();
  } else {
    playSong3();
  }
});
// Next song

function nextSong3() {
  songIndex3++;

  if (songIndex3 > songs3.length - 1) {
    songIndex3 = 0;
  }
  loadSong3(songs3[songIndex3]);
  playSong3();
}
nextBtn3.addEventListener("click", nextSong3);

// Prev song
function prevSong3() {
  songIndex3--;

  if (songIndex3 < 0) {
    songIndex3 = songs3.length - 1;
  }

  loadSong3(songs3[songIndex3]);
  playSong3();
}
prevBtn3.addEventListener("click", prevSong3);

//Progress bar

function updateProgress3(e) {
  const { duration, currentTime } = e.srcElement;
  const progressPercent = (currentTime / duration) * 100;
  progress3.style.width = `${progressPercent}%`;
}
audio3.addEventListener("timeupdate", updateProgress3);

//Set progress

function setProgress3(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audio3.duration;

  audio3.currentTime = (clickX / width) * duration;
}
progressContainer3.addEventListener("click", setProgress3);

//Autoplay
audio3.addEventListener("ended", nextSong3);
