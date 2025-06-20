async function main() {
  const res = await fetch('http://localhost:3000/activities');
  const activities = await res.json();

  const map = L.map('map').setView([0, 0], 2);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  const allCoords = [];

  for (const act of activities) {
    const latlngs = act.polyline.map(([lat, lng]: [number, number]) => [lat, lng]);
    L.polyline(latlngs, { color: 'blue', weight: 2 }).addTo(map);
    allCoords.push(...latlngs);
  }

  if (allCoords.length > 0) map.fitBounds(allCoords);
}

main();
