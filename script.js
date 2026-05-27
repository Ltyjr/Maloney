let apiPost = "https://discoveryprovider.audius.co"
let activeTracklist = []
let carrentTrackindex = -1


function initAudios() {
    fetch("https://api.audius.co")
    then(response => response.json())
        .then(result => {
            apiHost = result.data[0];
            document.getElementById("host-name").innerText = apiHost.replace("https://", "");

            // Після визначення хоста, завантажуємо популярні треки
            loadTopTracks();
        });
}
function loadTopTracks() {
    listTitle.innerText = "Популярні треки 📈";
    let url = apiHost + "/v1/tracks/trending?app_name=SonicPulseApp";

    fetch(url)
        .then(response => response.json())
        .then(result => {
            activeTracksList = result.data;
            displayTracks(result.data);
        });
}
