import axios from 'axios';

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  map: { summary_polyline: string | null };
}

export async function getActivities(accessToken: string): Promise<StravaActivity[]> {
  const all: StravaActivity[] = [];
  let page = 1;

  while (true) {
    try {
      const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { per_page: 50, page }
      });

      console.log("Response from Strava: ", response)

      const data = response.data as StravaActivity[];
      const cycling = data.filter(a => a.type === 'Ride' && a.map.summary_polyline);
      all.push(...cycling);
      if (data.length < 50) break;
      page++;
    } catch (error: any) {
      // TODO getting error here now!
      console.error("❌ Failed to get activities:");
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      throw error
    }
  }

  return all;
}
