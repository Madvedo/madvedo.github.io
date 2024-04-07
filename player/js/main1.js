const player1 = document.querySelector(".player1"),
  playBtn1 = document.querySelector(".play1"),
  prevBtn1 = document.querySelector(".prev1"),
  nextBtn1 = document.querySelector(".next1"),
  audio1 = document.querySelector(".audio1"),
  progressContainer1 = document.querySelector(".progress__container1"),
  progress1 = document.querySelector(".progress1"),
  title1 = document.querySelector(".song1"),
  cover1 = document.querySelector(".cover__img1"),
  imgSrc1 = document.querySelector(".img__src1");

// Названия песен
const songs1 = ["Белый Шум", "Кризис Идей", "Пир Во Время Чумы"];

// Песня по умолчанию
let songIndex1 = 0;

// Init
function loadSong1(song1) {
  title1.innerHTML = song1;
  audio1.src = `audio/${song1}.wav`;
  cover1.src = `/img/cover${songIndex1 + 1}.jpg`;
}

loadSong1(songs1[songIndex1]);

//Play
function playSong1() {
  player1.classList.add("play1");
  cover1.classList.add("active");
  imgSrc1.src = "/player/img/Pause.png";
  audio1.play();
}

//Pause
function pauseSong1() {
  player1.classList.remove("play1");
  cover1.classList.remove("active");
  imgSrc1.src = "/player/img/Play.png";
  audio1.pause();
}
playBtn1.addEventListener("click", () => {
  const isPlaying1 = player1.classList.contains("play1");
  if (isPlaying1) {
    pauseSong1();
  } else {
    playSong1();
  }
});
// Next song

function nextSong1() {
  songIndex1++;

  if (songIndex1 > songs1.length - 1) {
    songIndex1 = 0;
  }
  loadSong1(songs1[songIndex1]);
  playSong1();
}
nextBtn1.addEventListener("click", nextSong1);

// Prev song
function prevSong1() {
  songIndex1--;

  if (songIndex1 < 0) {
    songIndex1 = songs1.length - 1;
  }

  loadSong1(songs1[songIndex1]);
  playSong1();
}
prevBtn1.addEventListener("click", prevSong1);

//Progress bar

function updateProgress1(e) {
  const { duration, currentTime } = e.srcElement;
  const progressPercent = (currentTime / duration) * 100;
  progress1.style.width = `${progressPercent}%`;
}
audio1.addEventListener("timeupdate", updateProgress1);

//Set progress

function setProgress1(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audio1.duration;

  audio1.currentTime = (clickX / width) * duration;
}
progressContainer1.addEventListener("click", setProgress1);

//Autoplay
audio1.addEventListener("ended", nextSong1);
