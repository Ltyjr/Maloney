        const appName = "Maloney";
        let apiHost = "https://discoveryprovider.audius.co"; // Резервний хост за замовчуванням
        let activeTracksList = []; // Масив поточних треків для перемикання (Next/Prev)
        let currentTrackIndex = -1; // Індекс поточної пісні

        // DOM Елементи
        const audio = document.getElementById('audio-player');
        const tracksListContainer = document.getElementById('tracks-list');
        const listTitle = document.getElementById('list-title');
        const searchInput = document.getElementById('search-input');

        // КРОК 1: Автоматично шукаємо працюючий децентралізований сервер
        function initAudius() {
            fetch("https://api.audius.co")
                .then(response => response.json())
                .then(result => {
                    // Якщо список отримано, беремо перший сервер
                    if (result.data && result.data.length > 0) {
                        apiHost = result.data[0];
                    }
                    // Виводимо ім'я хоста на екран
                    document.getElementById("host-name").innerText = apiHost.replace("https://", "");
                    
                    // Відразу завантажуємо популярні треки при старті
                    loadTopTracks();
                });
        }

        // КРОК 2: Отримання ТОП популярних треків
        function loadTopTracks() {
            listTitle.innerText = "Популярне зараз 📈";
            let url = apiHost + "/v1/tracks/trending?app_name=" + appName;

            fetch(url)
                .then(response => response.json())
                .then(result => {
                    activeTracksList = result.data;
                    displayTracks(result.data);
                });
        }

        // КРОК 3: Пошук треків за текстом із поля введення
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
        // потім дописати
        // Функція для швидкого пошуку та програвання з плиток рекомендацій
        function quickPlayKeyword(keyword) {
            searchInput.value = keyword;
            searchMusic();
        }

        // КРОК 4: Виведення списку треків у тег <ul>
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
                
                // Рендеримо красивий рядок треку
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

                // Налаштовуємо подію кліку для програвання
                li.onclick = function() {
                    currentTrackIndex = i;
                    playSong(track);
                };

                tracksListContainer.appendChild(li);
            }
        }

        // КРОК 5: Запуск відтворення обраної пісні
        function playSong(track) {
            let streamUrl = apiHost + "/v1/tracks/" + track.id + "/stream?app_name=" + appName;
            let coverUrl = track.artwork ? track.artwork['150x150'] : '';

            // Оновлюємо інформацію в нижній панелі плеєра
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

            // Передаємо стрім у тег audio
            audio.src = streamUrl;
            audio.play();

            // Змінюємо іконку відтворення на паузу
            document.getElementById("play-icon").innerText = "pause";
        }


        // Кнопка великого релізу "Слухати зараз" (грає перший трек із списку)
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

        // Перемикання треків (Наступний / Попередній)
        function playNext() {
            if (activeTracksList.length === 0) return;
            currentTrackIndex++;
            if (currentTrackIndex >= activeTracksList.length) {
                currentTrackIndex = 0; // повертаємось на початок
            }
            playSong(activeTracksList[currentTrackIndex]);
        }

        function playPrev() {
            if (activeTracksList.length === 0) return;
            currentTrackIndex--;
            if (currentTrackIndex < 0) {
                currentTrackIndex = activeTracksList.length - 1; // в кінець
            }
            playSong(activeTracksList[currentTrackIndex]);
        }

        // Слідкуємо за часом відтворення
        audio.addEventListener('timeupdate', function() {
            if (isNaN(audio.duration)) return;
            
            // Оновлюємо текст часу
            document.getElementById("current-time").innerText = formatSeconds(audio.currentTime);
            document.getElementById("total-time").innerText = formatSeconds(audio.duration);

            // Оновлюємо лінію прогресу
            let pct = (audio.currentTime / audio.duration) * 100;
            document.getElementById("progress-fill").style.width = pct + "%";
        });

        // Автоматично грати наступну пісню при завершенні поточної
        audio.addEventListener('ended', function() {
            playNext();
        });

        // Перемотка пісні кліком
        function seekAudio(event) {
            if (isNaN(audio.duration)) return;
            let bar = event.currentTarget;
            let clickX = event.clientX - bar.getBoundingClientRect().left;
            let percentage = clickX / bar.clientWidth;
            
            audio.currentTime = percentage * audio.duration;
        }

        // Регулювання гучності кліком
        function seekVolume(event) {
            let bar = event.currentTarget;
            let clickX = event.clientX - bar.getBoundingClientRect().left;
            let pct = clickX / bar.clientWidth;
            
            if (pct < 0) pct = 0;
            if (pct > 1) pct = 1;

            audio.volume = pct;
            document.getElementById("volume-fill").style.width = (pct * 100) + "%";
        }

        // Переміщення фокуса на поле пошуку
        function focusSearch() {
            searchInput.focus();
            document.getElementById("btn-home").classList.remove("active");
            document.getElementById("btn-search").classList.add("active");
        }

        // Перетворення секунд у зручний вигляд хв:сек (0:00)
        function formatSeconds(seconds) {
            if (isNaN(seconds)) return "0:00";
            let m = Math.floor(seconds / 60);
            let s = Math.floor(seconds % 60).toString().padStart(2, '0');
            return m + ":" + s;
        }

        // Копіювання посилання на прямий стрім пісні
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

            // Показуємо красиве сповіщення замість alert()
            let toast = document.getElementById("toast-message");
            toast.style.display = "block";
            setTimeout(function() {
                toast.style.display = "none";
            }, 2500);
        }

        // Ініціалізуємо підключення до Audius на старті
        initAudius();
