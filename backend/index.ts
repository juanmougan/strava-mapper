import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { Request, Response } from 'express';
import { getCyclingActivities } from './getActivities.js';
import { decodePolyline } from './decodePolyline.js';
import 'dotenv/config';

const app = express();
app.use(cors());

const PORT = 3000;
const REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN!;    // TODO do I need this?
const CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;


// 1. Redirect user to Strava authorization
app.get('/auth/redirect', (_req, res) => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: 'http://localhost:3000/auth/callback',
    scope: 'read,activity:read_all',
    approval_prompt: 'auto',
  });
  res.redirect(`https://www.strava.com/oauth/authorize?${params}`);
});

// 2. Callback handler: exchange code for access token
app.get('/auth/callback', async (req, res) => {
  const code = req.query.code as string;
  try {
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    });

    // Access/refresh tokens for the user
    const { access_token, refresh_token, athlete } = response.data;

    // In a real app: store these in a DB or session
    console.log(`New token for ${athlete.username}:`, access_token);

    // Redirect to frontend with token as query param (or better: use cookies/session)
    res.redirect(`http://localhost:5173/?token=${access_token}`);
  } catch (e: any) {
    console.error(e.response?.data || e.message);
    res.status(500).send('OAuth failed');
  }
});

app.get('/activities', async (req: Request, res: Response): Promise<void> => {
  const token = req.query.token as string;
  if (!token) res.status(400).send('Missing token');

  try {
    const activities = await getCyclingActivities(token);
    const simplified = activities.map(a => ({
      id: a.id,
      name: a.name,
      polyline: decodePolyline(a.map.summary_polyline!)
    }));
    res.json(simplified);
  } catch (e: any) {
    const isUnauthorized = e.response?.status === 401;
    const message = e.response?.data || e.message;
    console.error("❌ Failed to get activities:", message);
    res.status(isUnauthorized ? 401 : 500).json({ error: message });
  }
});


app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
