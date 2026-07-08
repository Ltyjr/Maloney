const appName = "Maloney";
let apiHost = "https://discoveryprovider.audius.co";
let activeTracksList = [];
let currentTrackIndex = -1;
let favorites = [];
let localTracks = [];

const audio = document.getElementById('audio-player');
const tracksListContainer = document.getElementById('tracks-list');
const favoritesListContainer = document.getElementById('favorites-list');
const localTracksListContainer = document.getElementById('local-tracks-list');
const listTitle = document.getElementById('list-title');
const searchInput = document.getElementById('search-input');
const uploadInput = document.getElementById('music-upload');
const heroBanner = document.getElementById('hero-banner');
const heroTitle = document.getElementById('hero-title');
const heroDesc = document.getElementById('hero-desc');

function loadStoredTracks(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveFavorites() {
    localStorage.setItem('maloney-favorites', JSON.stringify(favorites));
}

function saveLocalTracks() {
    localStorage.setItem('maloney-local-tracks', JSON.stringify(localTracks));
}

function initAudius() {
    fetch('https://api.audius.co')
        .then(response => response.json())
        .then(result => {
            if (result.data && result.data.length > 0) {
                apiHost = result.data[0];
            }
            document.getElementById('host-name').innerText = apiHost.replace('https://', '');
            loadTopTracks();
        })
        .catch(() => {
            document.getElementById('host-name').innerText = 'offline';
        });
}

function loadTopTracks() {
    setActiveMenu('btn-home');
    listTitle.innerText = 'Популярне зараз 📈';
    let url = apiHost + '/v1/tracks/trending?app_name=' + appName;

    fetch(url)
        .then(response => response.json())
        .then(result => {
            activeTracksList = result.data || [];
            displayTracks(activeTracksList, tracksListContainer);
            updateHeroBanner(result.data || []);
        });
}

function updateHeroBanner(tracks) {
    if (tracks && tracks.length > 0) {
        let topTrack = tracks[0];
        let coverUrl = topTrack.artwork ? topTrack.artwork['480x480'] || topTrack.artwork['150x150'] : '';
        heroTitle.innerHTML = topTrack.title;
        heroDesc.innerText = 'Найактуальніший хіт на платформі сьогодні від автора ' + (topTrack.user?.name || 'невідомий автор') + '. Занурюйтесь у справжнє живе звучання!';

        if (coverUrl) {
            heroBanner.style.backgroundImage = "linear-gradient(rgba(27, 12, 43, 0.6), rgba(27, 12, 43, 0.95)), url('" + coverUrl + "')";
        }
    }
}

function searchMusic() {
    let query = searchInput.value.trim();
    if (query === '') return;

    listTitle.innerText = 'Результати пошуку для: ' + query;
    let url = apiHost + '/v1/tracks/search?query=' + encodeURIComponent(query) + '&app_name=' + appName;

    fetch(url)
        .then(response => response.json())
        .then(result => {
            activeTracksList = result.data || [];
            displayTracks(activeTracksList, tracksListContainer);
        });
}

function quickPlayKeyword(keyword) {
    searchInput.value = keyword;
    searchMusic();
}

function displayTracks(tracks, container) {
    container.innerHTML = '';

    if (!tracks || tracks.length === 0) {
        container.innerHTML = '<li class="empty-state">Нічого не знайдено 😢</li>';
        return;
    }

    for (let i = 0; i < tracks.length; i++) {
        let track = tracks[i];
        let coverUrl = getTrackCover(track);
        let isFavorite = isTrackFavorite(track);
        let li = document.createElement('li');
        li.className = 'track-item';

        li.innerHTML = `
            <div class="track-details">
                <div class="track-pic">
                    ${coverUrl ? `<img src="${coverUrl}" alt="cover">` : `<span class="material-symbols-outlined" style="font-size: 18px; color: #dcbfc7;">music_note</span>`}
                </div>
                <div class="track-meta">
                    <div class="track-title">${escapeHtml(getTrackTitle(track))}</div>
                    <div class="track-artist">${escapeHtml(getTrackArtist(track))}</div>
                </div>
            </div>
            <div class="track-actions">
                <button class="track-action-btn" type="button" aria-label="Улюблене">
                    <span class="material-symbols-outlined">${isFavorite ? 'favorite' : 'favorite_border'}</span>
                </button>
                <span class="material-symbols-outlined" style="font-size: 20px; color: #ffb0cb;">play_circle</span>
            </div>
        `;

        li.onclick = function() {
            currentTrackIndex = i;
            activeTracksList = tracks;
            playSong(track);
        };

        const favoriteButton = li.querySelector('.track-action-btn');
        favoriteButton.onclick = function(event) {
            event.stopPropagation();
            toggleFavorite(track);
        };

        container.appendChild(li);
    }
}

function playSong(track) {
    let coverUrl = getTrackCover(track);
    document.getElementById('player-title').innerText = getTrackTitle(track);
    document.getElementById('player-artist').innerText = getTrackArtist(track);

    let coverImg = document.getElementById('player-cover');
    let coverPlaceholder = document.getElementById('player-placeholder-art');

    if (coverUrl) {
        coverImg.src = coverUrl;
        coverImg.style.display = 'block';
        coverPlaceholder.style.display = 'none';
    } else {
        coverImg.style.display = 'none';
        coverPlaceholder.style.display = 'flex';
    }

    audio.src = getTrackStreamUrl(track);
    audio.play().catch(() => {});
    document.getElementById('play-icon').innerText = 'pause';
}

function playFeaturedSong() {
    if (activeTracksList.length > 0) {
        currentTrackIndex = 0;
        playSong(activeTracksList[0]);
    }
}

function togglePlay() {
    if (audio.paused) {
        audio.play().catch(() => {});
        document.getElementById('play-icon').innerText = 'pause';
    } else {
        audio.pause();
        document.getElementById('play-icon').innerText = 'play_arrow';
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

audio.addEventListener('timeupdate', function() {
    if (isNaN(audio.duration)) return;

    document.getElementById('current-time').innerText = formatSeconds(audio.currentTime);
    document.getElementById('total-time').innerText = formatSeconds(audio.duration);

    let pct = (audio.currentTime / audio.duration) * 100;
    document.getElementById('progress-fill').style.width = pct + '%';
});

audio.addEventListener('ended', function() {
    playNext();
});

function seekAudio(event) {
    if (isNaN(audio.duration)) return;
    let bar = event.currentTarget;
    let clickX = event.clientX - bar.getBoundingClientRect().left;
    let percentage = clickX / bar.clientWidth;

    audio.currentTime = percentage * audio.duration;
}

function seekVolume(event) {
    let bar = event.currentTarget;
    let clickX = event.clientX - bar.getBoundingClientRect().left;
    let pct = clickX / bar.clientWidth;

    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;

    audio.volume = pct;
    document.getElementById('volume-fill').style.width = (pct * 100) + '%';
}

function formatSeconds(seconds) {
    if (isNaN(seconds)) return '0:00';
    let m = Math.floor(seconds / 60);
    let s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return m + ':' + s;
}

function focusSearch() {
    searchInput.focus();
    setActiveMenu('btn-search');
}

function setActiveMenu(id) {
    document.getElementById('btn-home').classList.remove('active');
    document.getElementById('btn-search').classList.remove('active');
    document.getElementById('btn-favorites').classList.remove('active');
    document.getElementById('btn-local').classList.remove('active');
    document.getElementById(id).classList.add('active');
}

function triggerUpload() {
    uploadInput.click();
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleMusicUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
        const dataUrl = await readFileAsDataURL(file);
        localTracks.unshift({
            id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
            title: file.name.replace(/\.[^/.]+$/, ''),
            artist: 'Ви',
            source: 'local',
            streamUrl: dataUrl,
            artwork: ''
        });
    }

    saveLocalTracks();
    renderLocalTracks();
    showToast('Музику додано в Мою медіатеку');
    event.target.value = '';
}

uploadInput.addEventListener('change', handleMusicUpload);

function renderFavorites() {
    favoritesListContainer.innerHTML = '';
    if (favorites.length === 0) {
        favoritesListContainer.innerHTML = '<li class="empty-state">Поки що немає улюблених треків</li>';
        return;
    }
    displayTracks(favorites, favoritesListContainer);
}

function renderLocalTracks() {
    localTracksListContainer.innerHTML = '';
    if (localTracks.length === 0) {
        localTracksListContainer.innerHTML = '<li class="empty-state">Завантажте власні файли</li>';
        return;
    }
    displayTracks(localTracks, localTracksListContainer);
}

function showFavorites() {
    setActiveMenu('btn-favorites');
    listTitle.innerText = 'Улюблені треки ♥';
    activeTracksList = favorites.slice();
    displayTracks(activeTracksList, tracksListContainer);
    renderFavorites();
}

function showLocalTracks() {
    setActiveMenu('btn-local');
    listTitle.innerText = 'Моя музика';
    activeTracksList = localTracks.slice();
    displayTracks(activeTracksList, tracksListContainer);
    renderLocalTracks();
}

function toggleFavorite(track) {
    const id = getTrackId(track);
    const index = favorites.findIndex(item => getTrackId(item) === id);

    if (index >= 0) {
        favorites.splice(index, 1);
        showToast('Видалено з улюблених');
    } else {
        favorites.unshift({ ...track, source: track.source || 'audius' });
        showToast('Додано в улюблені');
    }

    saveFavorites();
    renderFavorites();
    displayTracks(activeTracksList, tracksListContainer);
}

function getTrackId(track) {
    return track.id || track.title + '-' + (track.artist || '');
}

function getTrackTitle(track) {
    return track.title || 'Без назви';
}

function getTrackArtist(track) {
    return track.user?.name || track.artist || 'Невідомий автор';
}

function getTrackCover(track) {
    if (!track.artwork) return '';
    return track.artwork['480x480'] || track.artwork['150x150'] || track.artwork['640x640'] || '';
}

function getTrackStreamUrl(track) {
    if (track.source === 'local' && track.streamUrl) return track.streamUrl;
    if (track.streamUrl) return track.streamUrl;
    return apiHost + '/v1/tracks/' + track.id + '/stream?app_name=' + appName;
}

function isTrackFavorite(track) {
    return favorites.some(item => getTrackId(item) === getTrackId(track));
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showToast(message) {
    const toast = document.getElementById('toast-message');
    toast.innerText = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2200);
}

function copyCurrentLink() {
    if (currentTrackIndex === -1) return;
    const track = activeTracksList[currentTrackIndex];

    if (track.source === 'local') {
        showToast('Локальний файл не має веб-посилання');
        return;
    }

    const streamUrl = getTrackStreamUrl(track);
    const dummy = document.createElement('input');
    document.body.appendChild(dummy);
    dummy.value = streamUrl;
    dummy.select();
    document.execCommand('copy');
    document.body.removeChild(dummy);
    showToast('Посилання скопійовано');
}

favorites = loadStoredTracks('maloney-favorites');
localTracks = loadStoredTracks('maloney-local-tracks');
renderFavorites();
renderLocalTracks();
initAudius();
