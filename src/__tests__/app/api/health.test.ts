/**
 * Health Check API Tests
 */

import { GET } from '@/app/api/health/route';
import { NextResponse } from 'next/server';

describe('Health Check API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status with valid response structure', async () => {

      const response = await GET();
      const data = await response.json();

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);

      // Check response structure
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('uptime');
      expect(data).toHaveProperty('environment');
      expect(data).toHaveProperty('checks');
    });

    it('should return healthy status when all checks pass', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.status).toBe('healthy');
      expect(response.status).toBe(200);
    });

    it('should include application check', async () => {
      const response = await GET();
      const data = await response.json();

      const appCheck = data.checks.find(
        (c: { name: string }) => c.name === 'application'
      );
      expect(appCheck).toBeDefined();
      expect(appCheck.status).toBe('pass');
    });

    it('should include environment check', async () => {
      const response = await GET();
      const data = await response.json();

      const envCheck = data.checks.find(
        (c: { name: string }) => c.name === 'environment'
      );
      expect(envCheck).toBeDefined();
      expect(envCheck.status).toBe('pass');
    });

    it('should include memory check', async () => {
      const response = await GET();
      const data = await response.json();

      const memoryCheck = data.checks.find(
        (c: { name: string }) => c.name === 'memory'
      );
      expect(memoryCheck).toBeDefined();
      expect(memoryCheck.message).toMatch(/Heap:/);
    });

    it('should return valid timestamp in ISO format', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.timestamp).toBeDefined();
      const timestamp = new Date(data.timestamp);
      expect(timestamp.toISOString()).toBe(data.timestamp);
    });

    it('should return uptime as a number', async () => {
      const response = await GET();
      const data = await response.json();

      expect(typeof data.uptime).toBe('number');
      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return correct environment', async () => {
      const response = await GET();
      const data = await response.json();

      // In test environment, NODE_ENV is 'test'
      expect(['test', 'development', 'production']).toContain(data.environment);
    });

    it('should include version', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.version).toBeDefined();
      expect(typeof data.version).toBe('string');
    });
  });
});
