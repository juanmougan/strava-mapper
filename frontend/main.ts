import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Alpine from 'alpinejs';

declare global {
  interface Window {
    stravaApp: () => any;
  }
}

function getTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("token");
}

async function fetchActivities() {
  const token = localStorage.getItem("strava_token");
  const res = await fetch(`http://localhost:3000/activities?token=${token}`);

  if (!res.ok) {
    if (res.status === 401 || res.status === 400) {
      localStorage.removeItem("strava_token"); // 🔥 clear invalid token
      window.location.reload(); // 🔄 restart the login flow
    }
    throw new Error(`Failed to fetch activities: ${res.status}`);
  }
  
  return await res.json();
}

async function initializeMap() {
  const map = L.map('map').setView([0, 0], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  return map;
}

function getCentroid(coords: [number, number][]): [number, number] {
  const total = coords.length;
  const sum = coords.reduce(
    ([sumLat, sumLng], [lat, lng]) => [sumLat + lat, sumLng + lng],
    [0, 0]
  );
  return [sum[0] / total, sum[1] / total];
}

async function renderMap(map: any, activities: any) {
  const allCoords: [number, number][] = [];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    const latlngs = act.polyline.map(([lat, lng]: [number, number]) => [lat, lng]);

    // Last activity gets a red, thicker polyline
    const isLast = i === activities.length - 1;
    const color = isLast ? 'red' : 'blue';
    const weight = isLast ? 4 : 2; // thicker for most recent

    L.polyline(latlngs, { color, weight }).addTo(map);

    L.polyline(latlngs, { color, weight: 2 }).addTo(map);
    allCoords.push(...latlngs);
  }

  if (allCoords.length > 0) {
    const center = getCentroid(allCoords);
    map.setView(center, 8); // 🔍 Center around average of all - 8 is a reasonable zoom
  }
}

window.stravaApp = function () {
  return {
    isLoggedIn: false,
    isLoading: false,

    async init() {
      const tokenFromUrl = getTokenFromUrl();
      if (tokenFromUrl) {
        localStorage.setItem("strava_token", tokenFromUrl);
        window.history.replaceState({}, document.title, "/");
        console.log("✅ Stored token from URL", tokenFromUrl);
      }

      const token = localStorage.getItem("strava_token");
      this.isLoggedIn = !!token;

      if (this.isLoggedIn) {
        this.isLoading = true;

        // 👇 make map container visible first
        this.$nextTick(async () => {
          const activities = await fetchActivities();
          const map = await initializeMap();

          document.getElementById("map")!.style.display = "block";
          setTimeout(() => {
            map.invalidateSize(); // ✅ Force Leaflet to recalculate dimensions
          }, 100); // give the browser time to paint layout


          renderMap(map, activities);
          this.isLoading = false;
        });
      }
    },

    redirectToStrava() {
      window.location.href = "http://localhost:3000/auth/redirect";
    }
  };
};

Alpine.start();
