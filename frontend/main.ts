import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Alpine from "alpinejs";
import { StravaActivity } from "../backend/src/getActivities";

declare global {
  interface Window {
    stravaApp: () => any;
  }
}

// Environment-aware API configuration
const getApiBaseUrl = () => {
  // In development, use localhost
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:3000";
  } else {
    // In production on GitHub Pages
    return "https://juanmougan.github.io/";
  }
};

const API_BASE_URL = getApiBaseUrl();

function getTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("token");
}

async function fetchActivitiesOldestFirst() {
  const token = localStorage.getItem("strava_token");
  const res = await fetch(`${API_BASE_URL}/activities?token=${token}`);

  if (!res.ok) {
    if (res.status === 401 || res.status === 400) {
      localStorage.removeItem("strava_token"); // 🔥 clear invalid token
      window.location.reload(); // 🔄 restart the login flow
    }
    throw new Error(`Failed to fetch activities: ${res.status}`);
  }

  let activities = await res.json();

  // Ensure oldest first
  activities.sort(
    (a: any, b: any) =>
      new Date(a.start_date_local).getTime() -
      new Date(b.start_date_local).getTime()
  );

  return activities;
}

async function initializeMap() {
  const map = L.map("map").setView([0, 0], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
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
    const latlngs = act.polyline.map(([lat, lng]: [number, number]) => [
      lat,
      lng,
    ]);

    const [color, weight] = setColorAndWeight(activities, i);

    L.polyline(latlngs, { color, weight }).addTo(map);

    allCoords.push(...latlngs);
  }

  if (allCoords.length > 0) {
    const center = getCentroid(allCoords);
    map.setView(center, 8); // 🔍 Center around average of all - 8 is a reasonable zoom
  }
}

function setColorAndWeight(activities: StravaActivity[], i: number) {
  const isLast = i === activities.length - 1;
  if (isLast) {
    return ["red", 4];
  } else {
    return ["blue", 2];
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
          const activitiesOldestFirst = await fetchActivitiesOldestFirst();
          const map = await initializeMap();

          document.getElementById("map")!.style.display = "block";
          setTimeout(() => {
            map.invalidateSize(); // ✅ Force Leaflet to recalculate dimensions
          }, 100); // give the browser time to paint layout

          renderMap(map, activitiesOldestFirst);
          this.isLoading = false;
        });
      }
    },

    redirectToStrava() {
      window.location.href = `${API_BASE_URL}/auth/redirect`;
    },
  };
};

Alpine.start();
