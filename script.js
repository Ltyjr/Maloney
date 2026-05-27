        const appName = "SonicPulseSimplePlayer";
        let apiHost = "https://discoveryprovider.audius.co"; // Початковий хост
        let activeTracksList = []; // Свіжий список треків
        let currentTrackIndex = -1; // Індекс поточної пісні

        // DOM елементи
        const audio = document.getElementById('audio-player');
        const tracksListContainer = document.getElementById('tracks-list');
        const listTitle = document.getElementById('list-title');
        const searchInput = document.getElementById('search-input');

        // Елементи динамічного банера
        const heroBanner = document.getElementById('hero-banner');
        const heroTitle = document.getElementById('hero-title');
        const heroDesc = document.getElementById('hero-desc');

        // КРОК 1: Автоматичний пошук робочого API сервера
        function initAudius() {
            fetch("https://api.audius.co")
                .then(response => response.json())
                .then(result => {
                    if (result.data && result.data.length > 0) {
                        apiHost = result.data[0];
                    }
                    document.getElementById("host-name").innerText = apiHost.replace("https://", "");
                    
                    // Завантажуємо тренди відразу після підключення до сервера
                    loadTopTracks();
                });
        }

        // КРОК 2: Завантаження ТОП треків з API
        function loadTopTracks() {
            listTitle.innerText = "Популярне зараз 📈";
            let url = apiHost + "/v1/tracks/trending?app_name=" + appName;

            fetch(url)
                .then(response => response.json())
                .then(result => {
                    activeTracksList = result.data;
                    displayTracks(result.data);
                    
                    // ОНОВЛЕННЯ БАНЕРА ДАНІМИ З ТОП-1 ТРЕКУ НА ПЛАТФОРМІ!
                    updateHeroBanner(result.data);
                });
        }

        // КРОК 3: Функція для динамічного оновлення банера релізу
        function updateHeroBanner(tracks) {
            if (tracks && tracks.length > 0) {
                // Беремо найперший (найпопулярніший трек №1 у світі прямо зараз)
                let topTrack = tracks[0];
                let coverUrl = topTrack.artwork ? topTrack.artwork['480x480'] || topTrack.artwork['150x150'] : '';

                // Оновлюємо заголовок та опис банера на реальні дані
                heroTitle.innerHTML = topTrack.title;
                heroDesc.innerText = "Найактуальніший хіт на платформі сьогодні від автора " + topTrack.user.name + ". Занурюйтесь у справжнє живе звучання!";

                // Оновлюємо фон банера на реальну обкладинку треку
                if (coverUrl) {
                    heroBanner.style.backgroundImage = "linear-gradient(rgba(27, 12, 43, 0.6), rgba(27, 12, 43, 0.95)), url('" + coverUrl + "')";
                }
            }
        }

        // КРОК 4: Пошук музики за текстом
        function searchMusic() {
            let query = searchInput.value.trim();
            if (query === "") return;

            listTitle.innerText = "Результати пошуку для: " + query;
            let url = apiHost + "/v1/tracks/search?query=" + encodeURIComponent(query) + "&app_name=" + appName;

            fetch(url)
                .then(response => response.json())
                .then(result => {
                    activeTracksList = result.data;
                    displayTracks(result.data);
                });
        }

        // Швидкий пошук з плиток меню
        function quickPlayKeyword(keyword) {
            searchInput.value = keyword;
            searchMusic();
        }

        // КРОК 5: Виведення списку треків у HTML-код сторінки
        function displayTracks(tracks) {
            tracksListContainer.innerHTML = ""; // очищаємо попередній список

            if (tracks.length === 0) {
                tracksListContainer.innerHTML = "<li style='padding: 20px; text-align: center; color: #dcbfc7;'>Нічого не знайдено 😢</li>";
                return;
            }

            for (let i = 0; i < tracks.length; i++) {
                let track = tracks[i];
                let coverUrl = track.artwork ? track.artwork['150x150'] : '';

                let li = document.createElement("li");
                li.className = "track-item";
                
                li.innerHTML = `
                    <div class="track-details">
                        <div class="track-pic">
                            ${coverUrl ? `<img src="${coverUrl}">` : `<span class="material-symbols-outlined" style="font-size: 18px; color: #dcbfc7;">music_note</span>`}
                        </div>
                        <div class="track-meta">
                            <div class="track-title">${track.title}</div>
                            <div class="track-artist">${track.user.name}</div>
                        </div>
                    </div>
                    <span class="material-symbols-outlined" style="font-size: 20px; color: #ffb0cb;">play_circle</span>
                `;

                li.onclick = function() {
                    currentTrackIndex = i;
                    playSong(track);
                };

                tracksListContainer.appendChild(li);
            }
        }

        // КРОК 6: Запуск відтворення обраного треку
        function playSong(track) {
            let streamUrl = apiHost + "/v1/tracks/" + track.id + "/stream?app_name=" + appName;
            let coverUrl = track.artwork ? track.artwork['150x150'] : '';

            // Оновлюємо нижній бар програвача
            document.getElementById("player-title").innerText = track.title;
            document.getElementById("player-artist").innerText = track.user.name;

            let coverImg = document.getElementById("player-cover");
            let coverPlaceholder = document.getElementById("player-placeholder-art");

            if (coverUrl) {
                coverImg.src = coverUrl;
                coverImg.style.display = "block";
                coverPlaceholder.style.display = "none";
            } else {
                coverImg.style.display = "none";
                coverPlaceholder.style.display = "flex";
            }

            // Запускаємо відтворення в audio
            audio.src = streamUrl;
            audio.play();

            document.getElementById("play-icon").innerText = "pause";
        }

        // Кнопка на банері "Слухати зараз" (тепер грає саме той трек, що відображений на банері!)
        function playFeaturedSong() {
            if (activeTracksList.length > 0) {
                currentTrackIndex = 0;
                playSong(activeTracksList[0]);
            }
        }

        // Керування паузою/програванням
        function togglePlay() {
            if (audio.paused) {
                audio.play();
                document.getElementById("play-icon").innerText = "pause";
            } else {
                audio.pause();
                document.getElementById("play-icon").innerText = "play_arrow";
            }
        }

        // Наступна/попередня пісня
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

        // Слідкуємо за часом програвання
        audio.addEventListener('timeupdate', function() {
            if (isNaN(audio.duration)) return;
            
            document.getElementById("current-time").innerText = formatSeconds(audio.currentTime);
            document.getElementById("total-time").innerText = formatSeconds(audio.duration);

            let pct = (audio.currentTime / audio.duration) * 100;
            document.getElementById("progress-fill").style.width = pct + "%";
        });

        // Після завершення пісні автоматично вмикаємо наступну
        audio.addEventListener('ended', function() {
            playNext();
        });

        // Перемотка кліком по таймлайну
        function seekAudio(event) {
            if (isNaN(audio.duration)) return;
            let bar = event.currentTarget;
            let clickX = event.clientX - bar.getBoundingClientRect().left;
            let percentage = clickX / bar.clientWidth;
            
            audio.currentTime = percentage * audio.duration;
        }

        // Зміна гучності кліком
        function seekVolume(event) {
            let bar = event.currentTarget;
            let clickX = event.clientX - bar.getBoundingClientRect().left;
            let pct = clickX / bar.clientWidth;
            
            if (pct < 0) pct = 0;
            if (pct > 1) pct = 1;

            audio.volume = pct;
            document.getElementById("volume-fill").style.width = (pct * 100) + "%";
        }

        // Зручний переклад секунд у хв:сек
        function formatSeconds(seconds) {
            if (isNaN(seconds)) return "0:00";
            let m = Math.floor(seconds / 60);
            let s = Math.floor(seconds % 60).toString().padStart(2, '0');
            return m + ":" + s;
        }

        function focusSearch() {
            searchInput.focus();
            document.getElementById("btn-home").classList.remove("active");
            document.getElementById("btn-search").classList.add("active");
        }

        // Копіювання посилання на трек
        function copyCurrentLink() {
            if (currentTrackIndex === -1) return;
            let track = activeTracksList[currentTrackIndex];
            let streamUrl = apiHost + "/v1/tracks/" + track.id + "/stream?app_name=" + appName;

            let dummy = document.createElement('input');
            document.body.appendChild(dummy);
            dummy.value = streamUrl;
            dummy.select();
            document.execCommand('copy');
            document.body.removeChild(dummy);

            // Показуємо плавне віконце повідомлення
            let toast = document.getElementById("toast-message");
            toast.style.display = "block";
            setTimeout(function() {
                toast.style.display = "none";
            }, 2500);
        }

        // Старт програми
        initAudius();
