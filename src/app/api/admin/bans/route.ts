// src/app/api/admin/bans/route.ts
// Admin API for managing IP bans

import { NextResponse } from 'next/server'

import { logger } from '@/lib/logging'
import {
  banIP,
  unbanIP,
  checkBan,
  getTrackingRecord,
  getAbuseStatsForIP,
  hashIP,
} from '@/lib/security'

import type { BanReason, BanType, BanDuration } from '@/types/abuse-tracking'
import type { NextRequest } from 'next/server'

const ADMIN_API_KEY = process.env.ADMIN_API_KEY

function validateAdminAuth(request: NextRequest): boolean {
  if (!ADMIN_API_KEY) {
    return false
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.slice(7)
  return token === ADMIN_API_KEY
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const ipHash = searchParams.get('ipHash')
  const rawIP = searchParams.get('ip')

  let targetHash: string | null = null

  if (rawIP) {
    targetHash = await hashIP(rawIP)
  } else if (ipHash) {
    targetHash = ipHash
  }

  if (!targetHash) {
    return NextResponse.json({ error: 'Either ipHash or ip parameter required' }, { status: 400 })
  }

  const [banCheck, tracking, stats] = await Promise.all([
    checkBan(targetHash),
    getTrackingRecord(targetHash),
    getAbuseStatsForIP(targetHash),
  ])

  return NextResponse.json({
    ipHash: targetHash,
    ban: banCheck,
    tracking,
    stats,
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as {
      ip?: string
      ipHash?: string
      reason: BanReason
      banType?: BanType
      duration?: BanDuration
      description?: string
    }

    const { ip, ipHash, reason, banType, duration, description } = body

    let targetHash: string | null = null

    if (ip) {
      targetHash = await hashIP(ip)
    } else if (ipHash) {
      targetHash = ipHash
    }

    if (!targetHash) {
      return NextResponse.json({ error: 'Either ipHash or ip required' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ error: 'Reason required' }, { status: 400 })
    }

    const options: {
      banType?: BanType
      duration?: BanDuration
      description?: string
      createdBy?: string
    } = { createdBy: 'admin' }

    if (banType) options.banType = banType
    if (duration) options.duration = duration
    if (description) options.description = description

    const ban = await banIP(targetHash, reason, options)

    return NextResponse.json({ success: true, ban })
  } catch (error) {
    logger.error('Ban creation error', error instanceof Error ? error : null, {})
    return NextResponse.json({ error: 'Failed to create ban' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  if (!validateAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const ipHash = searchParams.get('ipHash')
  const rawIP = searchParams.get('ip')

  let targetHash: string | null = null

  if (rawIP) {
    targetHash = await hashIP(rawIP)
  } else if (ipHash) {
    targetHash = ipHash
  }

  if (!targetHash) {
    return NextResponse.json({ error: 'Either ipHash or ip parameter required' }, { status: 400 })
  }

  const success = await unbanIP(targetHash)

  if (!success) {
    return NextResponse.json({ error: 'Failed to remove ban' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
