// src/lib/logging/alerts.ts
// Alert detection and notification system

import { nanoid } from 'nanoid'

import { logger } from './logger'
import { metrics } from './metrics'

import type {
  Alert,
  AlertDefinition,
  AlertType,
  AlertSeverity,
  AlertWebhookPayload,
  WebhookConfig,
} from '@/types/logging'

const ALERT_DEFINITIONS: AlertDefinition[] = [
  {
    type: 'error_rate_spike',
    name: 'Error Rate Spike',
    description: 'Error rate exceeded threshold over monitoring window',
    severity: 'critical',
    threshold: 0.05,
    windowMs: 5 * 60 * 1000,
    cooldownMs: 15 * 60 * 1000,
  },
  {
    type: 'llm_api_failure',
    name: 'LLM API Consecutive Failures',
    description: 'Multiple consecutive LLM API failures detected',
    severity: 'critical',
    threshold: 3,
    windowMs: 60 * 1000,
    cooldownMs: 10 * 60 * 1000,
  },
  {
    type: 'high_latency',
    name: 'High Latency',
    description: 'P95 latency exceeded threshold',
    severity: 'warning',
    threshold: 5000,
    windowMs: 5 * 60 * 1000,
    cooldownMs: 15 * 60 * 1000,
  },
  {
    type: 'budget_exceeded',
    name: 'Token Budget Exceeded',
    description: 'Debate exceeded token budget',
    severity: 'warning',
    threshold: 1,
    windowMs: 60 * 1000,
    cooldownMs: 60 * 60 * 1000,
  },
  {
    type: 'connection_spike',
    name: 'Connection Spike',
    description: 'Unusual spike in active connections',
    severity: 'warning',
    threshold: 100,
    windowMs: 60 * 1000,
    cooldownMs: 10 * 60 * 1000,
  },
]

class AlertManager {
  private activeAlerts = new Map<AlertType, Alert>()
  private lastTriggered = new Map<AlertType, number>()
  private consecutiveFailures = new Map<string, number>()
  private webhooks: WebhookConfig[] = []

  constructor() {
    this.loadWebhookConfig()
  }

  private loadWebhookConfig(): void {
    const slackUrl = process.env.ALERT_SLACK_WEBHOOK_URL
    const discordUrl = process.env.ALERT_DISCORD_WEBHOOK_URL
    const genericUrl = process.env.ALERT_WEBHOOK_URL

    if (slackUrl) {
      this.webhooks.push({
        url: slackUrl,
        type: 'slack',
        enabled: true,
        minSeverity: 'warning',
      })
    }

    if (discordUrl) {
      this.webhooks.push({
        url: discordUrl,
        type: 'discord',
        enabled: true,
        minSeverity: 'warning',
      })
    }

    if (genericUrl) {
      this.webhooks.push({
        url: genericUrl,
        type: 'generic',
        enabled: true,
        minSeverity: 'warning',
      })
    }
  }

  private getDefinition(type: AlertType): AlertDefinition {
    const def = ALERT_DEFINITIONS.find((d) => d.type === type)
    if (!def) {
      throw new Error(`Unknown alert type: ${type}`)
    }
    return def
  }

  private isInCooldown(type: AlertType): boolean {
    const lastTime = this.lastTriggered.get(type)
    if (!lastTime) return false

    const definition = this.getDefinition(type)
    return Date.now() - lastTime < definition.cooldownMs
  }

  private createAlert(
    type: AlertType,
    value: number,
    context: Record<string, unknown> = {}
  ): Alert {
    const definition = this.getDefinition(type)
    return {
      id: nanoid(),
      type,
      severity: definition.severity,
      message: `${definition.name}: ${definition.description}. Value: ${value}, Threshold: ${definition.threshold}`,
      value,
      threshold: definition.threshold,
      triggeredAt: new Date(),
      notified: false,
      context,
    }
  }

  trigger(type: AlertType, value: number, context: Record<string, unknown> = {}): Alert | null {
    const definition = this.getDefinition(type)

    if (value < definition.threshold) {
      this.resolveIfActive(type)
      return null
    }

    if (this.isInCooldown(type)) {
      return null
    }

    const alert = this.createAlert(type, value, context)
    this.activeAlerts.set(type, alert)
    this.lastTriggered.set(type, Date.now())

    logger.error(`Alert triggered: ${alert.message}`, null, {
      alertType: type,
      alertSeverity: definition.severity,
      value,
      threshold: definition.threshold,
      ...context,
    })

    this.notifyWebhooks(alert)

    return alert
  }

  private resolveIfActive(type: AlertType): void {
    const alert = this.activeAlerts.get(type)
    if (alert && !alert.resolvedAt) {
      alert.resolvedAt = new Date()
      logger.info(`Alert resolved: ${type}`, {
        alertType: type,
        duration: alert.resolvedAt.getTime() - alert.triggeredAt.getTime(),
      })
    }
  }

  recordLLMFailure(provider: string): void {
    const key = `llm:${provider}`
    const count = (this.consecutiveFailures.get(key) ?? 0) + 1
    this.consecutiveFailures.set(key, count)

    this.trigger('llm_api_failure', count, { provider })
  }

  recordLLMSuccess(provider: string): void {
    const key = `llm:${provider}`
    this.consecutiveFailures.set(key, 0)
    this.resolveIfActive('llm_api_failure')
  }

  checkErrorRate(): void {
    const systemMetrics = metrics.getSystemMetrics()
    if (systemMetrics.requestsTotal === 0) return

    const errorRate = systemMetrics.errorsTotal / systemMetrics.requestsTotal
    this.trigger('error_rate_spike', errorRate)
  }

  checkLatency(): void {
    const systemMetrics = metrics.getSystemMetrics()
    const histogram = systemMetrics.responseTimeHistogram

    if (histogram.count === 0) return

    const p95Index = Math.ceil(histogram.count * 0.95)
    let p95Value = 0

    const bucketThresholds = [50, 100, 250, 500, 1000, 2500, 5000, 10000]
    const bucketCounts = [
      histogram.le_50,
      histogram.le_100,
      histogram.le_250,
      histogram.le_500,
      histogram.le_1000,
      histogram.le_2500,
      histogram.le_5000,
      histogram.le_10000,
    ]

    for (let i = 0; i < bucketCounts.length; i++) {
      const bucketCount = bucketCounts[i]
      if (bucketCount !== undefined && bucketCount >= p95Index) {
        p95Value = bucketThresholds[i] ?? 0
        break
      }
    }

    if (p95Value === 0) {
      p95Value = 10000
    }

    this.trigger('high_latency', p95Value)
  }

  checkConnections(): void {
    const systemMetrics = metrics.getSystemMetrics()
    this.trigger('connection_spike', systemMetrics.activeConnections)
  }

  runChecks(): void {
    this.checkErrorRate()
    this.checkLatency()
    this.checkConnections()
  }

  private async notifyWebhooks(alert: Alert): Promise<void> {
    const enabledWebhooks = this.webhooks.filter(
      (w) => w.enabled && this.severityMeetsMinimum(alert.severity, w.minSeverity)
    )

    const payload: AlertWebhookPayload = {
      alert,
      environment: process.env.NODE_ENV ?? 'development',
      appName: 'LLM Debate Arena',
      timestamp: new Date().toISOString(),
    }

    for (const webhook of enabledWebhooks) {
      try {
        const body = this.formatWebhookBody(webhook.type, payload)
        await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        alert.notified = true
      } catch (error) {
        logger.error('Failed to send webhook notification', error as Error, {
          webhookType: webhook.type,
          alertType: alert.type,
        })
      }
    }
  }

  private severityMeetsMinimum(severity: AlertSeverity, minimum: AlertSeverity): boolean {
    const order: AlertSeverity[] = ['warning', 'critical']
    return order.indexOf(severity) >= order.indexOf(minimum)
  }

  private formatWebhookBody(
    type: 'slack' | 'discord' | 'generic',
    payload: AlertWebhookPayload
  ): unknown {
    const { alert, environment, appName, timestamp } = payload

    if (type === 'slack') {
      return {
        text: `*${appName}* Alert`,
        attachments: [
          {
            color: alert.severity === 'critical' ? '#FF0000' : '#FFA500',
            fields: [
              { title: 'Alert', value: alert.message, short: false },
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Environment', value: environment, short: true },
              { title: 'Time', value: timestamp, short: true },
            ],
          },
        ],
      }
    }

    if (type === 'discord') {
      return {
        embeds: [
          {
            title: `${appName} Alert`,
            description: alert.message,
            color: alert.severity === 'critical' ? 0xff0000 : 0xffa500,
            fields: [
              { name: 'Severity', value: alert.severity, inline: true },
              { name: 'Environment', value: environment, inline: true },
              { name: 'Time', value: timestamp, inline: true },
            ],
          },
        ],
      }
    }

    return payload
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values()).filter((a) => !a.resolvedAt)
  }

  getAlertHistory(): Alert[] {
    return Array.from(this.activeAlerts.values())
  }

  addWebhook(config: WebhookConfig): void {
    this.webhooks.push(config)
  }
}

export const alertManager = new AlertManager()

let checkInterval: ReturnType<typeof setInterval> | null = null

export function startAlertChecks(intervalMs = 60000): void {
  if (checkInterval) return
  checkInterval = setInterval(() => {
    alertManager.runChecks()
  }, intervalMs)
}

export function stopAlertChecks(): void {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

export function recordLLMFailure(provider: string): void {
  alertManager.recordLLMFailure(provider)
}

export function recordLLMSuccess(provider: string): void {
  alertManager.recordLLMSuccess(provider)
}
