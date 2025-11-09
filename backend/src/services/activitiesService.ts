import CircuitBreaker from 'opossum';
import { getActivities as stravaGetActivities } from '../trackers/stravaClient';
import { decodePolyline } from '../decodePolyline';

const circuitBreakerOptions = {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 15 * 60 * 1000, // 15 minutes to match Strava's quota reset
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  name: 'StravaActivitiesCircuitBreaker',
  group: 'strava-api',
  errorFilter: (error: any) => {
    // Open circuit breaker immediately on 429 (rate limit exceeded)
    if (error.response?.status === 429) {
      return true;
    }
    // Also open on other 5xx server errors
    return error.response?.status >= 500;
  }
};

const getActivitiesBreaker = new CircuitBreaker(stravaGetActivities, circuitBreakerOptions);

export async function getActivities(token: string) {
  const activities = await getActivitiesBreaker.fire(token);
  const simplified = activities.map(a => ({
    id: a.id,
    name: a.name,
    start_date_local: a.start_date_local,
    polyline: decodePolyline(a.map.summary_polyline!)
  }));
  return simplified;
}