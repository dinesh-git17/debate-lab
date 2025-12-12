// src/components/summary/share-section.tsx
/**
 * Social sharing interface for completed debates.
 * Supports multiple platforms, URL copying, and embeddable iframe generation.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'

import { clientLogger } from '@/lib/client-logger'
import { cn } from '@/lib/utils'
import { useSummaryStore } from '@/store/summary-store'

interface ShareSectionProps {
  debateId: string
  shareUrl?: string | undefined
  shortCode?: string | undefined
  className?: string | undefined
}

type SharePlatform = 'twitter' | 'linkedin' | 'facebook' | 'reddit' | 'copy' | 'native'

export function ShareSection({
  debateId,
  shareUrl: initialShareUrl,
  shortCode,
  className,
}: ShareSectionProps) {
  const topic = useSummaryStore((s) => s.topic)
  const assignment = useSummaryStore((s) => s.assignment)
  const revealState = useSummaryStore((s) => s.revealState)
  const format = useSummaryStore((s) => s.format)

  const [copied, setCopied] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [shareUrl, setShareUrl] = useState(initialShareUrl ?? '')
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function')
  }, [])

  useEffect(() => {
    async function fetchShareSettings() {
      try {
        const response = await fetch(`/api/debate/${debateId}/share`)
        if (response.ok) {
          const data = (await response.json()) as {
            settings: { shareUrl: string }
          }
          setShareUrl(data.settings.shareUrl)
        }
      } catch {
        // Fallback handled by getFullUrl()
      }
    }

    if (!initialShareUrl && debateId) {
      fetchShareSettings()
    }
  }, [debateId, initialShareUrl])

  const getFullUrl = useCallback(() => {
    if (shareUrl) return shareUrl
    if (typeof window === 'undefined') return ''
    return window.location.href
  }, [shareUrl])

  const getShareText = useCallback(() => {
    const baseText = `I just watched an AI debate on "${topic}"`

    if (revealState === 'revealed' && assignment) {
      return `${baseText}. ${assignment.for.displayName} argued FOR and ${assignment.against.displayName} argued AGAINST. Check it out!`
    }

    return `${baseText}. Can you guess which AI argued which side?`
  }, [topic, revealState, assignment])

  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      const url = getFullUrl()
      const text = getShareText()

      switch (platform) {
        case 'twitter': {
          const twitterUrl = new URL('https://twitter.com/intent/tweet')
          twitterUrl.searchParams.set('text', text)
          twitterUrl.searchParams.set('url', url)
          twitterUrl.searchParams.set('hashtags', 'AIDebate,LLM')
          window.open(twitterUrl.toString(), '_blank', 'width=550,height=420,noopener,noreferrer')
          break
        }

        case 'linkedin': {
          const linkedinUrl = new URL('https://www.linkedin.com/sharing/share-offsite/')
          linkedinUrl.searchParams.set('url', url)
          window.open(linkedinUrl.toString(), '_blank', 'width=550,height=420,noopener,noreferrer')
          break
        }

        case 'facebook': {
          const facebookUrl = new URL('https://www.facebook.com/sharer/sharer.php')
          facebookUrl.searchParams.set('u', url)
          window.open(facebookUrl.toString(), '_blank', 'width=550,height=420,noopener,noreferrer')
          break
        }

        case 'reddit': {
          const redditUrl = new URL('https://reddit.com/submit')
          redditUrl.searchParams.set('url', url)
          redditUrl.searchParams.set('title', `AI Debate: ${topic}`)
          window.open(redditUrl.toString(), '_blank', 'width=550,height=600,noopener,noreferrer')
          break
        }

        case 'native': {
          if (navigator.share) {
            try {
              await navigator.share({
                title: `AI Debate: ${topic?.slice(0, 50)}...`,
                text,
                url,
              })
            } catch {
              // User cancelled share dialog
            }
          }
          break
        }

        case 'copy': {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          } catch {
            clientLogger.error('Failed to copy to clipboard')
          }
          break
        }
      }
    },
    [getFullUrl, getShareText, topic]
  )

  const handleCopyEmbed = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const embedCode = `<iframe src="${origin}/embed/${debateId}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`

    try {
      await navigator.clipboard.writeText(embedCode)
      setEmbedCopied(true)
      setTimeout(() => setEmbedCopied(false), 2000)
    } catch {
      clientLogger.error('Failed to copy embed code')
    }
  }, [debateId])

  const fullUrl = getFullUrl()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const embedCode = `<iframe src="${origin}/embed/${debateId}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`

  return (
    <section className={cn('w-full', className)}>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Share This Debate</h2>
        <p className="text-muted-foreground">
          Share with friends and see if they can guess which AI argued which side
        </p>
      </div>

      <div className="max-w-lg mx-auto mb-6">
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-2.5 overflow-hidden">
            <p className="text-sm font-mono truncate text-foreground/80">{fullUrl}</p>
          </div>
          <button
            onClick={() => handleShare('copy')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl shrink-0',
              'border border-border transition-colors',
              copied
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                : 'bg-muted text-foreground hover:bg-muted/80'
            )}
          >
            {copied ? (
              <>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="font-medium">Copied!</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span className="font-medium">Copy</span>
              </>
            )}
          </button>
        </div>
        {shortCode && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Short link code: {shortCode}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
        <button
          onClick={() => handleShare('twitter')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl',
            'bg-black text-white',
            'hover:bg-gray-800 transition-colors',
            'focus:outline-none focus:ring-4 focus:ring-gray-500/30'
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="font-medium">Share</span>
        </button>

        <button
          onClick={() => handleShare('linkedin')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl',
            'bg-[#0077B5] text-white',
            'hover:bg-[#006097] transition-colors',
            'focus:outline-none focus:ring-4 focus:ring-[#0077B5]/30'
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <span className="font-medium">Share</span>
        </button>

        <button
          onClick={() => handleShare('facebook')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl',
            'bg-[#1877F2] text-white',
            'hover:bg-[#166FE5] transition-colors',
            'focus:outline-none focus:ring-4 focus:ring-[#1877F2]/30'
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="font-medium">Share</span>
        </button>

        <button
          onClick={() => handleShare('reddit')}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-xl',
            'bg-[#FF4500] text-white',
            'hover:bg-[#E03D00] transition-colors',
            'focus:outline-none focus:ring-4 focus:ring-[#FF4500]/30'
          )}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
          <span className="font-medium">Share</span>
        </button>

        {canNativeShare && (
          <button
            onClick={() => handleShare('native')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl',
              'bg-muted text-foreground border border-border',
              'hover:bg-muted/80 transition-colors',
              'focus:outline-none focus:ring-4 focus:ring-primary/20'
            )}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            <span className="font-medium">Share</span>
          </button>
        )}
      </div>

      <div className="max-w-lg mx-auto">
        <button
          onClick={() => setShowEmbed(!showEmbed)}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2',
            'text-sm text-muted-foreground hover:text-foreground transition-colors'
          )}
        >
          <svg
            className={cn('w-4 h-4 transition-transform', showEmbed && 'rotate-180')}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span>{showEmbed ? 'Hide Embed Code' : 'Get Embed Code'}</span>
        </button>

        {showEmbed && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium mb-2">Embed this debate on your site:</p>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
              {embedCode}
            </pre>
            <button
              onClick={handleCopyEmbed}
              className={cn(
                'mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm',
                'border border-border transition-colors',
                embedCopied
                  ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              )}
            >
              {embedCopied ? 'Copied!' : 'Copy Embed Code'}
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 max-w-lg mx-auto">
        <p className="text-xs text-muted-foreground text-center mb-2">
          Preview how it will look when shared:
        </p>
        <div className="rounded-xl border border-border overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/og?topic=${encodeURIComponent(topic ?? '')}&format=${encodeURIComponent(format ?? 'Standard')}&for=${encodeURIComponent(assignment?.for.displayName ?? 'AI')}&against=${encodeURIComponent(assignment?.against.displayName ?? 'AI')}&status=completed&turns=8&date=${new Date().toLocaleDateString()}`}
            alt="Share preview"
            className="w-full"
          />
        </div>
      </div>
    </section>
  )
}
