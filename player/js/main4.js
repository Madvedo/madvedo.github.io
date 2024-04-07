const player4 = document.querySelector(".player4"),
  playBtn4 = document.querySelector(".play4"),
  prevBtn4 = document.querySelector(".prev4"),
  nextBtn4 = document.querySelector(".next4"),
  audio4 = document.querySelector(".audio4"),
  progressContainer4 = document.querySelector(".progress__container4"),
  progress4 = document.querySelector(".progress4"),
  title4 = document.querySelector(".song4"),
  cover4 = document.querySelector(".cover__img4"),
  imgSrc4 = document.querySelector(".img__src4");

// Названия песен
const songs4 = ["Падал снег", "По зову Солнца"];

// Песня по умолчанию
let songIndex4 = 0;

// Init
function loadSong4(song4) {
  title4.innerHTML = song4;
  audio4.src = `audio/${song4}.wav`;
  cover4.src = `/img/cover_pzs.jpg`;
}

loadSong4(songs4[songIndex4]);

//Play
function playSong4() {
  player4.classList.add("play4");
  cover4.classList.add("active");
  imgSrc4.src = "/player/img/Pause.png";
  audio4.play();
}

//Pause
function pauseSong4() {
  player4.classList.remove("play4");
  cover4.classList.remove("active");
  imgSrc4.src = "/player/img/Play.png";
  audio4.pause();
}
playBtn4.addEventListener("click", () => {
  const isPlaying4 = player4.classList.contains("play4");
  if (isPlaying4) {
    pauseSong4();
  } else {
    playSong4();
  }
});
// Next song

function nextSong4() {
  songIndex4++;

  if (songIndex4 > songs4.length - 1) {
    songIndex4 = 0;
  }
  loadSong4(songs4[songIndex4]);
  playSong4();
}
nextBtn4.addEventListener("click", nextSong4);

// Prev song
function prevSong4() {
  songIndex4--;

  if (songIndex4 < 0) {
    songIndex4 = songs4.length - 1;
  }

  loadSong4(songs4[songIndex4]);
  playSong4();
}
prevBtn4.addEventListener("click", prevSong4);

//Progress bar

function updateProgress4(e) {
  const { duration, currentTime } = e.srcElement;
  const progressPercent = (currentTime / duration) * 100;
  progress4.style.width = `${progressPercent}%`;
}
audio4.addEventListener("timeupdate", updateProgress4);

//Set progress

function setProgress4(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audio4.duration;

  audio4.currentTime = (clickX / width) * duration;
}
progressContainer4.addEventListener("click", setProgress4);

//Autoplay
audio4.addEventListener("ended", nextSong4);
