/**
 * Health Check API Endpoint
 *
 * Provides health status for Azure App Service and monitoring systems.
 * Used by:
 * - Azure App Service health probes
 * - Load balancers
 * - Monitoring systems
 * - CI/CD pipeline verification
 */

import { NextResponse } from 'next/server';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
  }[];
}

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * GET /api/health
 *
 * Returns the health status of the application.
 */
export async function GET(): Promise<NextResponse<HealthCheckResponse>> {
  const checks: HealthCheckResponse['checks'] = [];

  // Check 1: Basic application health
  checks.push({
    name: 'application',
    status: 'pass',
    message: 'Application is running',
  });

  // Check 2: Environment variables
  const requiredEnvVars = ['NODE_ENV'];
  const missingEnvVars = requiredEnvVars.filter(
    (v) => !process.env[v]
  );

  checks.push({
    name: 'environment',
    status: missingEnvVars.length === 0 ? 'pass' : 'fail',
    message:
      missingEnvVars.length === 0
        ? 'All required environment variables are set'
        : `Missing: ${missingEnvVars.join(', ')}`,
  });

  // Check 3: Memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
  const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

  checks.push({
    name: 'memory',
    status: memoryPercent < 90 ? 'pass' : 'fail',
    message: `Heap: ${heapUsedMB}MB / ${heapTotalMB}MB (${memoryPercent.toFixed(1)}%)`,
  });

  // Determine overall status
  const failedChecks = checks.filter((c) => c.status === 'fail');
  let status: HealthCheckResponse['status'] = 'healthy';

  if (failedChecks.length > 0) {
    // If only non-critical checks fail, mark as degraded
    const criticalChecks = ['application'];
    const criticalFailed = failedChecks.some((c) =>
      criticalChecks.includes(c.name)
    );
    status = criticalFailed ? 'unhealthy' : 'degraded';
  }

  const response: HealthCheckResponse = {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    environment: process.env.NODE_ENV || 'development',
    checks,
  };

  // Return appropriate HTTP status code
  const httpStatus = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  return NextResponse.json(response, { status: httpStatus });
}
