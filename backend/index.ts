import express from 'express';
import cors from 'cors';
import { getAccessToken } from './getAccessToken.js';
import { getCyclingActivities } from './getActivities.js';
import { decodePolyline } from './decodePolyline.js';
import 'dotenv/config';

const app = express();
app.use(cors());

const PORT = 3000;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN!;
const CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

app.get('/activities', async (_req, res) => {
  console.log("Got these properties: ", REFRESH_TOKEN, CLIENT_ID, CLIENT_SECRET)
  try {
    const token = await getAccessToken(REFRESH_TOKEN, CLIENT_ID, CLIENT_SECRET);
    const activities = await getCyclingActivities(token);
    const simplified = activities.map(a => ({
      id: a.id,
      name: a.name,
      polyline: decodePolyline(a.map.summary_polyline!)
    }));
    res.json(simplified);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error fetching activities');
  }
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
