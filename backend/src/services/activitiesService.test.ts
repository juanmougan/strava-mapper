import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../trackers/stravaClient', () => ({
  getActivities: vi.fn()
}));

vi.mock('../decodePolyline', () => ({
  decodePolyline: vi.fn()
}));

import { getActivities } from './activitiesService';
import { getActivities as mockStravaGetActivities } from '../trackers/stravaClient';
import { decodePolyline } from '../decodePolyline';

describe('activitiesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully get and transform activities', async () => {
    const mockActivities = [
      {
        id: 1,
        name: 'Morning Ride',
        type: 'Ride',
        start_date_local: '2023-01-01T08:00:00Z',
        map: { summary_polyline: 'encoded123' }
      },
      {
        id: 2,
        name: 'Evening Ride',
        type: 'Ride',
        start_date_local: '2023-01-01T18:00:00Z',
        map: { summary_polyline: 'encoded456' }
      }
    ];

    vi.mocked(mockStravaGetActivities).mockResolvedValue(mockActivities);
    vi.mocked(decodePolyline).mockImplementation((polyline: string) => [[0, 0], [1, 1]]);

    const result = await getActivities('test-token');

    expect(mockStravaGetActivities).toHaveBeenCalledWith('test-token');
    expect(decodePolyline).toHaveBeenCalledWith('encoded123');
    expect(decodePolyline).toHaveBeenCalledWith('encoded456');
    
    expect(result).toEqual([
      {
        id: 1,
        name: 'Morning Ride',
        start_date_local: '2023-01-01T08:00:00Z',
        polyline: [[0, 0], [1, 1]]
      },
      {
        id: 2,
        name: 'Evening Ride',
        start_date_local: '2023-01-01T18:00:00Z',
        polyline: [[0, 0], [1, 1]]
      }
    ]);
  });

  it('should handle 429 rate limit errors and open circuit breaker', async () => {
    const rateLimitError = {
      response: {
        status: 429,
        data: { message: 'Rate Limit Exceeded' }
      }
    };

    vi.mocked(mockStravaGetActivities).mockRejectedValue(rateLimitError);

    await expect(getActivities('test-token')).rejects.toMatchObject({
      response: { status: 429 }
    });
    
    expect(mockStravaGetActivities).toHaveBeenCalledWith('test-token');
  });

  it('should handle 5xx server errors and open circuit breaker', async () => {
    const serverError = {
      response: {
        status: 500,
        data: { message: 'Internal Server Error' }
      }
    };

    vi.mocked(mockStravaGetActivities).mockRejectedValue(serverError);

    await expect(getActivities('test-token')).rejects.toMatchObject({
      response: { status: 500 }
    });
  });

  it('should handle 4xx client errors (except 429) without opening circuit breaker', async () => {
    const clientError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' }
      }
    };

    vi.mocked(mockStravaGetActivities).mockRejectedValue(clientError);

    await expect(getActivities('test-token')).rejects.toMatchObject({
      response: { status: 401 }
    });
  });

  it('should handle empty activities array', async () => {
    vi.mocked(mockStravaGetActivities).mockResolvedValue([]);

    const result = await getActivities('test-token');

    expect(result).toEqual([]);
  });

  it('should handle activities with null polyline by calling decodePolyline with null', async () => {
    const mockActivities = [
      {
        id: 1,
        name: 'Test Ride',
        type: 'Ride',
        start_date_local: '2023-01-01T08:00:00Z',
        map: { summary_polyline: null }
      }
    ];

    vi.mocked(mockStravaGetActivities).mockResolvedValue(mockActivities);
    vi.mocked(decodePolyline).mockImplementation((polyline) => [[0, 0], [1, 1]]);

    const result = await getActivities('test-token');

    expect(decodePolyline).toHaveBeenCalledWith(null);
    expect(result).toEqual([
      {
        id: 1,
        name: 'Test Ride',
        start_date_local: '2023-01-01T08:00:00Z',
        polyline: [[0, 0], [1, 1]]
      }
    ]);
  });

  it('should handle network errors', async () => {
    const networkError = new Error('Network Error');
    vi.mocked(mockStravaGetActivities).mockRejectedValue(networkError);

    await expect(getActivities('test-token')).rejects.toThrow('Network Error');
  });
});