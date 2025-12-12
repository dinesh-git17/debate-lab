// route.ts
/**
 * Application health check endpoint.
 * Monitors system resources, active alerts, and connection pools for load balancer probes.
 */

import { NextResponse } from 'next/server'

import { metrics, alertManager } from '@/lib/logging'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    memory: { status: 'pass' | 'warn' | 'fail'; value: number; threshold: number }
    activeAlerts: { status: 'pass' | 'warn' | 'fail'; count: number }
    connections: { status: 'pass' | 'warn' | 'fail'; value: number; threshold: number }
  }
}

const MEMORY_THRESHOLD_MB = 512
const CONNECTION_THRESHOLD = 500

export async function GET(): Promise<NextResponse<HealthStatus>> {
  const systemMetrics = metrics.getSystemMetrics()
  const activeAlerts = alertManager.getActiveAlerts()

  const memoryStatus: 'pass' | 'warn' | 'fail' =
    systemMetrics.memoryUsageMb > MEMORY_THRESHOLD_MB * 1.5
      ? 'fail'
      : systemMetrics.memoryUsageMb > MEMORY_THRESHOLD_MB
        ? 'warn'
        : 'pass'

  const alertStatus: 'pass' | 'warn' | 'fail' = activeAlerts.some((a) => a.severity === 'critical')
    ? 'fail'
    : activeAlerts.length > 0
      ? 'warn'
      : 'pass'

  const connectionStatus: 'pass' | 'warn' | 'fail' =
    systemMetrics.activeConnections > CONNECTION_THRESHOLD * 1.5
      ? 'fail'
      : systemMetrics.activeConnections > CONNECTION_THRESHOLD
        ? 'warn'
        : 'pass'

  const overallStatus: 'healthy' | 'degraded' | 'unhealthy' =
    memoryStatus === 'fail' || alertStatus === 'fail' || connectionStatus === 'fail'
      ? 'unhealthy'
      : memoryStatus === 'warn' || alertStatus === 'warn' || connectionStatus === 'warn'
        ? 'degraded'
        : 'healthy'

  const response: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: systemMetrics.uptimeSeconds,
    checks: {
      memory: {
        status: memoryStatus,
        value: systemMetrics.memoryUsageMb,
        threshold: MEMORY_THRESHOLD_MB,
      },
      activeAlerts: {
        status: alertStatus,
        count: activeAlerts.length,
      },
      connections: {
        status: connectionStatus,
        value: systemMetrics.activeConnections,
        threshold: CONNECTION_THRESHOLD,
      },
    },
  }

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200

  return NextResponse.json(response, { status: statusCode })
}
