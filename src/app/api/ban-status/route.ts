// route.ts
/**
 * User ban status endpoint.
 * Returns ban information for the current client while concealing shadow bans.
 */

import { NextResponse } from 'next/server'

import { logger } from '@/lib/logging'
import { checkBan, hashIP, getClientIP } from '@/lib/security'

import type { NextRequest } from 'next/server'

export interface BanStatusResponse {
  isBanned: boolean
  banType?: 'temporary' | 'permanent' | 'shadow' | undefined
  reason?: string | undefined
  expiresAt?: string | undefined
  remainingMs?: number | undefined
}

export async function GET(request: NextRequest): Promise<NextResponse<BanStatusResponse>> {
  try {
    const ip = getClientIP(request)
    const ipHash = await hashIP(ip)
    const banCheck = await checkBan(ipHash)

    if (!banCheck.isBanned || !banCheck.ban) {
      return NextResponse.json({ isBanned: false })
    }

    if (banCheck.ban.banType === 'shadow') {
      return NextResponse.json({ isBanned: false })
    }

    return NextResponse.json({
      isBanned: true,
      banType: banCheck.ban.banType,
      reason: getBanReasonMessage(banCheck.ban.reason),
      expiresAt: banCheck.ban.expiresAt?.toISOString(),
      remainingMs: banCheck.remainingTime,
    })
  } catch (error) {
    logger.error('Ban status check error', error instanceof Error ? error : null, {})
    return NextResponse.json({ isBanned: false })
  }
}

function getBanReasonMessage(reason: string): string {
  switch (reason) {
    case 'content_filter_violation':
      return 'Multiple content policy violations'
    case 'prompt_injection':
      return 'Attempted prompt injection attacks'
    case 'rate_limit_abuse':
      return 'Excessive rate limit violations'
    case 'spam':
      return 'Spam activity detected'
    case 'harassment':
      return 'Harassment or abusive behavior'
    case 'illegal_content':
      return 'Illegal content submission'
    case 'bot_activity':
      return 'Automated bot activity detected'
    case 'manual':
      return 'Policy violation'
    default:
      return 'Terms of Service violation'
  }
}
