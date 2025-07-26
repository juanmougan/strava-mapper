import { describe, it, expect, vi } from 'vitest';

// 1. Mock the entire module
vi.mock('@mapbox/polyline', () => ({
  default: {
    decode: vi.fn(() => [[1, 2], [3, 4]])
  }
}));

import polyline from '@mapbox/polyline';
import { decodePolyline } from './decodePolyline.js';

describe('decodePolyline', () => {
  it('calls polyline.decode with the provided encoded string', () => {
    const encoded = 'abc123';
    
    const result = decodePolyline(encoded);
    
    expect(polyline.decode).toHaveBeenCalledWith(encoded);
    expect(result).toEqual([[1, 2], [3, 4]]);
  });
});
