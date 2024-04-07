const player5 = document.querySelector(".player5"),
  playBtn5 = document.querySelector(".play5"),
  prevBtn5 = document.querySelector(".prev5"),
  nextBtn5 = document.querySelector(".next5"),
  audio5 = document.querySelector(".audio5"),
  progressContainer5 = document.querySelector(".progress__container5"),
  progress5 = document.querySelector(".progress5"),
  title5 = document.querySelector(".song5"),
  cover5 = document.querySelector(".cover__img5"),
  imgSrc5 = document.querySelector(".img__src5");

// Названия песен
const songs5 = ["Зима была холодной"];

// Песня по умолчанию
let songIndex5 = 0;

// Init
function loadSong5(song5) {
  title5.innerHTML = song5;
  audio5.src = `audio/${song5}.wav`;
  cover5.src = `/img/zbh.jpg`;
}

loadSong5(songs5[songIndex5]);

//Play
function playSong5() {
  player5.classList.add("play5");
  cover5.classList.add("active");
  imgSrc5.src = "/player/img/Pause.png";
  audio5.play();
}

//Pause
function pauseSong5() {
  player5.classList.remove("play5");
  cover5.classList.remove("active");
  imgSrc5.src = "/player/img/Play.png";
  audio5.pause();
}
playBtn5.addEventListener("click", () => {
  const isPlaying5 = player5.classList.contains("play5");
  if (isPlaying5) {
    pauseSong5();
  } else {
    playSong5();
  }
});
// Next song

function nextSong5() {
  songIndex5++;

  if (songIndex5 > songs5.length - 1) {
    songIndex5 = 0;
  }
  loadSong5(songs5[songIndex5]);
  playSong5();
}
nextBtn5.addEventListener("click", nextSong5);

// Prev song
function prevSong5() {
  songIndex5--;

  if (songIndex5 < 0) {
    songIndex5 = songs5.length - 1;
  }

  loadSong5(songs5[songIndex5]);
  playSong5();
}
prevBtn5.addEventListener("click", prevSong5);

//Progress bar

function updateProgress5(e) {
  const { duration, currentTime } = e.srcElement;
  const progressPercent = (currentTime / duration) * 100;
  progress5.style.width = `${progressPercent}%`;
}
audio5.addEventListener("timeupdate", updateProgress5);

//Set progress

function setProgress5(e) {
  const width = this.clientWidth;
  const clickX = e.offsetX;
  const duration = audio5.duration;

  audio5.currentTime = (clickX / width) * duration;
}
progressContainer5.addEventListener("click", setProgress5);

//Autoplay
audio5.addEventListener("ended", nextSong5);
