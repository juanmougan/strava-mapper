import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function getTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("token");
}

async function main() {
  console.log("Running in browser:", typeof window !== 'undefined');

  const tokenFromUrl = getTokenFromUrl();
  if (tokenFromUrl) {
    localStorage.setItem("strava_token", tokenFromUrl);
    // Optionally clean the URL
    window.history.replaceState({}, document.title, "/");
    console.log("I've got the token", tokenFromUrl, " so maybe redirect here to getActivities?")
  } else {
    // TODO this makes the button superflous, so remove this redirect maybe?
    console.log("I guess I need to redirect! Since I don't have any token yet")
    window.location.href = "http://localhost:3000/auth/redirect";
    return;
  }

  // ✅ Token exists → fetch activities and render map
  const activities = await fetchActivities();
  
  const map = await initializeMap();
  
  renderMap(map, activities);
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
