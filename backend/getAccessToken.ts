import axios from 'axios';

export async function getAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string> {
  try {
    console.log("\n\nWill get token...\n");

    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    console.log("✅ Got token:", response.data.access_token);
    return response.data.access_token;

  } catch (error: any) {
    console.error("❌ Failed to get access token:");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    throw new Error('Unable to get access token');
  }
}
