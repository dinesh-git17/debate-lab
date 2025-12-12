// src/app/s/[code]/route.ts
/**
 * Short URL redirect handler for shared debates.
 * Resolves short codes to debate IDs and validates public access before redirecting.
 */

import { NextResponse } from 'next/server'

import { isPubliclyAccessible, resolveShortCode } from '@/lib/share-store'
import { isValidShortCode } from '@/lib/short-code'

import type { NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ code: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { code } = await params

  if (!isValidShortCode(code)) {
    return NextResponse.redirect(new URL('/not-found', request.url))
  }

  const debateId = await resolveShortCode(code)

  if (!debateId) {
    return NextResponse.redirect(new URL('/not-found', request.url))
  }

  const isPublic = await isPubliclyAccessible(debateId)

  if (!isPublic) {
    return NextResponse.redirect(new URL('/not-found', request.url))
  }

  return NextResponse.redirect(new URL(`/debate/${debateId}/summary`, request.url))
}
