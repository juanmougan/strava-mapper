import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function getTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("token");
}

async function main() {

  const tokenFromUrl = getTokenFromUrl();
  if (tokenFromUrl) {
    localStorage.setItem("strava_token", tokenFromUrl);
    window.history.replaceState({}, document.title, "/");
    console.log("✅ Stored token from URL");
  }

  const token = localStorage.getItem("strava_token");

  const loginButton = document.getElementById("login-btn") as HTMLButtonElement;

  if (!token) {
    console.log("No token yet! Need to authenticate on Strava");
    loginButton.style.display = "inline-block";
    loginButton.onclick = () => {
      window.location.href = "http://localhost:3000/auth/redirect";
    };
    return; // Do not try to load map
  } else {
    // ✅ Token exists → fetch activities and render map
    // TODO refactor these flow into functions
    console.log("Token exists!");
    const authSection = document.getElementById("auth-section") as HTMLDivElement;
    authSection.style.display = "none";
    const activities = await fetchActivities();
    
    const map = await initializeMap();
    
    renderMap(map, activities);
  }
}

async function fetchActivities() {
  const token = localStorage.getItem("strava_token");
  const res = await fetch(`http://localhost:3000/activities?token=${token}`);
  return await res.json();
}

async function initializeMap() {
  const map = L.map('map').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  return map;
}

async function renderMap(map: any, activities: any) {
  const allCoords = [];

  for (const act of activities) {
    const latlngs = act.polyline.map(([lat, lng]: [number, number]) => [lat, lng]);
    L.polyline(latlngs, { color: 'blue', weight: 2 }).addTo(map);
    allCoords.push(...latlngs);
  }

  if (allCoords.length > 0) map.fitBounds(allCoords);
}

main();
