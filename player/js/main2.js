const player2 = document.querySelector(".player2"),
  playBtn2 = document.querySelector(".play2"),
  prevBtn2 = document.querySelector(".prev2"),
  nextBtn2 = document.querySelector(".next2"),
  audio2 = document.querySelector(".audio2"),
  progressContainer2 = document.querySelector(".progress__container2"),
  progress2 = document.querySelector(".progress2"),
  title2 = document.querySelector(".song2"),
  cover2 = document.querySelector(".cover__img2"),
  imgSrc2 = document.querySelector(".img__src2");

// Названия песен
const songs2 = [
  "Почему",
  "Двое",
  "666-поколение",
  "Километры",
  "Кома",
  "Путь в вечность",
  "Бездна",
  "Сон Роны",
];

// Песня по умолчанию
let songIndex2 = 0;

// Init
function loadSong2(song2) {
  title2.innerHTML = song2;
  audio2.src = `audio/${song2}.wav`;
  cover2.src = `/img/cover.jpg`;
}

loadSong2(songs2[songIndex2]);

//Play
function playSong2() {
  player2.classList.add("play2");
  cover2.classList.add("active");
  imgSrc2.src = "/player/img/Pause.png";
  audio2.play();
}

//Pause
function pauseSong2() {
  player2.classList.remove("play2");
  cover2.classList.remove("active");
  imgSrc2.src = "/player/img/Play.png";
  audio2.pause();
}
playBtn2.addEventListener("click", () => {
  const isPlaying2 = player2.classList.contains("play2");
  if (isPlaying2) {
    pauseSong2();
  } else {
    playSong2();
  }
});
// Next song

function nextSong2() {
  songIndex2++;

  if (songIndex2 > songs2.length - 1) {
    songIndex2 = 0;
  }
  loadSong2(songs2[songIndex2]);
  playSong2();
}
nextBtn2.addEventListener("click", nextSong2);

// Prev song
function prevSong2() {
  songIndex2--;

  if (songIndex2 < 0) {
    songIndex2 = songs2.length - 1;
  }

  loadSong2(songs2[songIndex2]);
  playSong2();
}
prevBtn2.addEventListener("click", prevSong2);

//Progress bar

function updateProgress2(e) {
  const { duration, currentTime } = e.srcElement;
  const progressPercent = (currentTime / duration) * 100;
  progress2.style.width = `${progressPercent}%`;
}
audio2.addEventListener("timeupdate", updateProgress2);

//Set progress

function setProgress2(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audio2.duration;

  audio2.currentTime = (clickX / width) * duration;
}
progressContainer2.addEventListener("click", setProgress2);

//Autoplay
audio2.addEventListener("ended", nextSong2);
