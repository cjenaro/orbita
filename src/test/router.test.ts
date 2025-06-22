import { describe, it, expect, vi, beforeEach } from 'vitest';
import { router } from '../router';

// Mock axios
vi.mock('axios', () => ({
  default: vi.fn(() => Promise.resolve({ data: { component: 'Test', props: {}, url: '/test' } }))
}));

describe('OrbitaRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create router instance', () => {
    expect(router).toBeDefined();
    expect(typeof router.visit).toBe('function');
    expect(typeof router.post).toBe('function');
    expect(typeof router.reload).toBe('function');
  });

  it('should have correct method shortcuts', () => {
    expect(typeof router.put).toBe('function');
    expect(typeof router.patch).toBe('function');
    expect(typeof router.delete).toBe('function');
  });
});