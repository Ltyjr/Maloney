document.addEventListener('mousemove', function (event) {
    const star = document.createElement('span');
    star.classList.add('star');
    star.innerText = '💜';
    star.style.left = event.clientX + 'px';
    star.style.top = event.clientY + 'px';
    document.body.appendChild(star);

    setTimeout(() => {
        star.remove();
    }, 800);
});

const appName = "Maloney";
let apiHost = "https://discoveryprovider.audius.co";
let activeTracksList = [];
let currentTrackIndex = -1;
let likedTracks = JSON.parse(localStorage.getItem('likedTracks')) || [];
let localTracks = [];

function saveLocalTracks() {
    localStorage.setItem('localTracksMeta', JSON.stringify(localTracks.map(track => ({
        title: track.title,
        artist: track.artist,
        isLocal: true,
        src: track.src
    }))));
}

function loadLocalTracks() {
    try {
        const raw = localStorage.getItem('localTracksMeta');
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return parsed.filter(track => track && track.title).map(track => ({ ...track, src: track.src }));
    } catch (error) {
        return [];
    }
}

const audio = document.getElementById('audio-player');
const tracksListContainer = document.getElementById('tracks-list');
const listTitle = document.getElementById('list-title');
const searchInput = document.getElementById('search-input');
const homePage = document.getElementById('home-page');
const localTracksPage = document.getElementById('local-tracks-page');
const localTrackInput = document.getElementById('local-track-input');
const localTracksList = document.getElementById('local-tracks-list');
const selectedFilesText = document.getElementById('selected-files-text');
const heroBanner = document.getElementById('hero-banner');
const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');
const genresGrid = document.getElementById('genres-grid');



function initAudius() {
    localTracks = loadLocalTracks();
    renderLocalTracks();

    fetch("https://api.audius.co")
        .then(response => response.json())
        .then(result => {
            if (result.data && result.data.length > 0) {
                apiHost = result.data[0];
            }

            document.getElementById("host-name").innerText = apiHost.replace("https://", "");
            loadTopTracks();
        });
}

function setActiveMenu(activeButtonId) {
    document.querySelectorAll('.menu-item').forEach(button => {
        button.classList.remove('active');
    });

    const activeButton = document.getElementById(activeButtonId);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function showHomePage() {
    homePage.classList.remove('hidden');
    localTracksPage.classList.add('hidden');
}

function showLocalTracksPage() {
    setActiveMenu('btn-local-tracks');
    homePage.classList.add('hidden');
    localTracksPage.classList.remove('hidden');
    activeTracksList = localTracks;
    currentTrackIndex = -1;
    renderLocalTracks();
}

function saveLikedTracks() {
    localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
}

function toggleLike(track, event) {
    event.stopPropagation();

    const trackId = track.id || track.title;

    if (isTrackLiked(trackId)) {
        likedTracks = likedTracks.filter(likedTrack => (likedTrack.id || likedTrack.title) !== trackId);
    } else {
        likedTracks.unshift(track);
    }

    saveLikedTracks();

    if (document.getElementById('btn-my-tracks').classList.contains('active')) {
        showMyTracks();
    } else {
        displayTracks(activeTracksList);
    }
}

function isTrackLiked(trackId) {
    return likedTracks.some(track => (track.id || track.title) === trackId);
}

function loadTopTracks() {
    showHomePage();
    setActiveMenu('btn-home');
    listTitle.innerText = "Популярне зараз 📈";
    const url = apiHost + "/v1/tracks/trending?app_name=" + appName;

    fetch(url)
        .then(response => response.json())
        .then(result => {
            activeTracksList = result.data;
            displayTracks(result.data);
            updateHeroBanner(result.data);
            renderPopularGenres(result.data);
        });
}

function renderPopularGenres(tracks) {
    if (!genresGrid) return;

    const genreCounts = {};

    tracks.forEach(track => {
        if (!track.genre) return;

        genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
    });

    const popularGenres = Object.keys(genreCounts)
        .sort((a, b) => genreCounts[b] - genreCounts[a])
        .slice(0, 8);

    if (popularGenres.length === 0) {
        genresGrid.innerHTML = "<button class='genre-chip' type='button'>Жанри не знайдено</button>";
        return;
    }

    genresGrid.innerHTML = "";

    popularGenres.forEach(genre => {
        const button = document.createElement("button");
        button.className = "genre-chip";
        button.type = "button";
        button.innerText = genre;
        button.onclick = function () {
            loadGenreTracks(genre);
        };

        genresGrid.appendChild(button);
    });
}

function loadGenreTracks(genre) {
    showHomePage();
    setActiveMenu('btn-home');
    listTitle.innerText = "Популярне в жанрі: " + genre;

    const url = apiHost + "/v1/tracks/trending?genre=" + encodeURIComponent(genre) + "&app_name=" + appName;

    fetch(url)
        .then(response => response.json())
        .then(result => {
            activeTracksList = result.data;
            currentTrackIndex = -1;
            displayTracks(result.data);
            updateHeroBanner(result.data);
        });
}

function updateHeroBanner(tracks) {
    if (tracks && tracks.length > 0) {
        const topTrack = tracks[0];
        const coverUrl = topTrack.artwork ? topTrack.artwork['480x480'] || topTrack.artwork['150x150'] : '';

        heroTitle.innerText = topTrack.title;
        heroDesc.innerText = "Найактуальніший хіт на платформі сьогодні від автора " + topTrack.user.name + ". Занурюйтесь у справжнє живе звучання!";

        if (coverUrl) {
            heroBanner.style.backgroundImage = "linear-gradient(rgba(27, 12, 43, 0.6), rgba(27, 12, 43, 0.95)), url('" + coverUrl + "')";
        }
    }
}

function searchMusic() {
    const query = searchInput.value.trim();
    if (query === "") return;

    showHomePage();
    setActiveMenu('btn-search');
    listTitle.innerText = "Результати пошуку для: " + query;
    const url = apiHost + "/v1/tracks/search?query=" + encodeURIComponent(query) + "&app_name=" + appName;

    fetch(url)
        .then(response => response.json())
        .then(result => {
            activeTracksList = result.data;
            displayTracks(result.data);
        });
}

function showMyTracks() {
    showHomePage();
    setActiveMenu('btn-my-tracks');
    activeTracksList = likedTracks;
    currentTrackIndex = -1;
    listTitle.innerText = "Улюблене";
    displayTracks(likedTracks, "Натисніть сердечко біля треку, і він з'явиться тут 💜");
}

function quickPlayKeyword(keyword) {
    searchInput.value = keyword;
    searchMusic();
}

function loadTracksFromFolder() {
    const files = localTrackInput.files;

    if (files.length === 0) {
        selectedFilesText.innerText = "Файли ще не обрано";
        return;
    }

    localTracks.forEach(track => {
        if (track.src && track.src.startsWith('blob:')) {
            URL.revokeObjectURL(track.src);
        }
    });

    localTracks = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const isAudio = file.type.startsWith("audio/")
            || fileName.endsWith(".mp3")
            || fileName.endsWith(".wav")
            || fileName.endsWith(".ogg")
            || fileName.endsWith(".m4a")
            || fileName.endsWith(".aac")
            || fileName.endsWith(".flac");

        if (isAudio) {
            localTracks.push({
                title: file.name.replace(/\.[^/.]+$/, ''),
                artist: 'Ви',
                src: URL.createObjectURL(file),
                isLocal: true
            });
        }
    }

    saveLocalTracks();
    activeTracksList = localTracks;
    currentTrackIndex = -1;
    renderLocalTracks();

    if (localTracks.length === 0) {
        selectedFilesText.innerText = "Серед обраних файлів аудіо не знайдено";
    } else {
        selectedFilesText.innerText = "Знайдено треків: " + localTracks.length;
    }
}

function renderLocalTracks() {
    localTracksList.innerHTML = "";

    if (localTracks.length === 0) {
        localTracksList.innerHTML = "<li class='empty-tracks'>Тут поки немає ваших треків</li>";
        return;
    }

    for (let i = 0; i < localTracks.length; i++) {
        const track = localTracks[i];
        const li = document.createElement("li");

        li.className = "track-item";
        li.innerHTML = `
            <div class="track-details">
                <div class="track-pic">
                    <span class="material-symbols-outlined" style="font-size: 18px; color: #dcbfc7;">music_note</span>
                </div>
                <div class="track-meta">
                    <div class="track-title">${escapeHtml(track.title)}</div>
                    <div class="track-artist">${escapeHtml(track.artist)}</div>
                </div>
            </div>
            <div class="track-actions">
                <span class="material-symbols-outlined" style="font-size: 20px; color: #ffb0cb;">play_circle</span>
            </div>
        `;

        li.onclick = function () {
            activeTracksList = localTracks;
            currentTrackIndex = i;
            playSong(track);
        };

        localTracksList.appendChild(li);
    }
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function displayTracks(tracks, emptyMessage = "Нічого не знайдено 😢") {
    tracksListContainer.innerHTML = "";

    if (!tracks || tracks.length === 0) {
        tracksListContainer.innerHTML = "<li class='empty-tracks'>" + emptyMessage + "</li>";
        return;
    }

    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const coverUrl = track.artwork ? track.artwork['150x150'] : '';
        const li = document.createElement("li");
        const trackId = track.id || track.title;
        const likedClass = isTrackLiked(trackId) ? "liked" : "";
        const heartIcon = isTrackLiked(trackId) ? "favorite" : "favorite_border";

        li.className = "track-item";
        li.innerHTML = `
            <div class="track-details">
                <div class="track-pic">
                    ${coverUrl ? `<img src="${coverUrl}" alt="">` : `<span class="material-symbols-outlined" style="font-size: 18px; color: #dcbfc7;">music_note</span>`}
                </div>
                <div class="track-meta">
                    <div class="track-title">${escapeHtml(track.title)}</div>
                    <div class="track-artist">${escapeHtml(track.user?.name || track.artist || 'Невідомий автор')}</div>
                </div>
            </div>
            <div class="track-actions">
                <button class="btn-like ${likedClass}" title="Додати в улюблене">
                    <span class="material-symbols-outlined">${heartIcon}</span>
                </button>
                <span class="material-symbols-outlined" style="font-size: 20px; color: #ffb0cb;">play_circle</span>
            </div>
        `;

        li.querySelector('.btn-like').onclick = function (event) {
            toggleLike(track, event);
        };

        li.onclick = function () {
            currentTrackIndex = i;
            playSong(track);
        };

        tracksListContainer.appendChild(li);
    }
}

function playSong(track) {
    if (track.isLocal) {
        document.getElementById("player-title").innerText = track.title;
        document.getElementById("player-artist").innerText = track.artist;
        document.getElementById("player-cover").style.display = "none";
        document.getElementById("player-placeholder-art").style.display = "flex";

        audio.src = track.src;
        audio.play();
        document.getElementById("play-icon").innerText = "pause";
        return;
    }

    const streamUrl = apiHost + "/v1/tracks/" + track.id + "/stream?app_name=" + appName;
    const coverUrl = track.artwork ? track.artwork['150x150'] : '';

    document.getElementById("player-title").innerText = track.title;
    document.getElementById("player-artist").innerText = track.user.name;

    const coverImg = document.getElementById("player-cover");
    const coverPlaceholder = document.getElementById("player-placeholder-art");

    if (coverUrl) {
        coverImg.src = coverUrl;
        coverImg.style.display = "block";
        coverPlaceholder.style.display = "none";
    } else {
        coverImg.style.display = "none";
        coverPlaceholder.style.display = "flex";
    }

    audio.src = streamUrl;
    audio.play();
    document.getElementById("play-icon").innerText = "pause";
}

function playFeaturedSong() {
    if (activeTracksList.length > 0) {
        currentTrackIndex = 0;
        playSong(activeTracksList[0]);
    }
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        document.getElementById("play-icon").innerText = "pause";
    } else {
        audio.pause();
        document.getElementById("play-icon").innerText = "play_arrow";
    }
}

function playNext() {
    if (activeTracksList.length === 0) return;

    currentTrackIndex++;
    if (currentTrackIndex >= activeTracksList.length) {
        currentTrackIndex = 0;
    }

    playSong(activeTracksList[currentTrackIndex]);
}

function playPrev() {
    if (activeTracksList.length === 0) return;

    currentTrackIndex--;
    if (currentTrackIndex < 0) {
        currentTrackIndex = activeTracksList.length - 1;
    }

    playSong(activeTracksList[currentTrackIndex]);
}

audio.addEventListener('timeupdate', function () {
    if (isNaN(audio.duration)) return;

    document.getElementById("current-time").innerText = formatSeconds(audio.currentTime);
    document.getElementById("total-time").innerText = formatSeconds(audio.duration);

    const pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById("progress-fill").style.width = pct + "%";
});

audio.addEventListener('ended', function () {
    playNext();
});

function seekAudio(event) {
    if (isNaN(audio.duration)) return;

    const bar = event.currentTarget;
    const clickX = event.clientX - bar.getBoundingClientRect().left;
    const percentage = clickX / bar.clientWidth;

    audio.currentTime = percentage * audio.duration;
}

function seekVolume(event) {
    const bar = event.currentTarget;
    const clickX = event.clientX - bar.getBoundingClientRect().left;
    let pct = clickX / bar.clientWidth;

    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;

    audio.volume = pct;
    document.getElementById("volume-fill").style.width = (pct * 100) + "%";
}

function formatSeconds(seconds) {
    if (isNaN(seconds)) return "0:00";

    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return m + ":" + s;
}

function focusSearch() {
    showHomePage();
    setActiveMenu('btn-search');
    searchInput.focus();
}

function copyCurrentLink() {
    if (currentTrackIndex === -1) return;

    const track = activeTracksList[currentTrackIndex];
    if (track.isLocal) return;

    const streamUrl = apiHost + "/v1/tracks/" + track.id + "/stream?app_name=" + appName;

    const dummy = document.createElement('input');
    document.body.appendChild(dummy);
    dummy.value = streamUrl;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);

    const toast = document.getElementById("toast-message");
    toast.style.display = "block";
    setTimeout(function () {
        toast.style.display = "none";
    }, 2500);
}

initAudius();
