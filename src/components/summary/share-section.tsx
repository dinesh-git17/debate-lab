// src/components/summary/share-section.tsx
/**
 * Social sharing interface for completed debates.
 * Supports multiple platforms, URL copying, and embeddable iframe generation.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { SocialIcon } from 'react-social-icons'

import { clientLogger } from '@/lib/client-logger'
import { cn } from '@/lib/utils'
import { useSummaryStore } from '@/store/summary-store'

interface ShareSectionProps {
  debateId: string
  shareUrl?: string | undefined
  className?: string | undefined
}

type SharePlatform = 'twitter' | 'linkedin' | 'facebook' | 'reddit' | 'copy' | 'native'

export function ShareSection({
  debateId,
  shareUrl: initialShareUrl,
  className,
}: ShareSectionProps) {
  const topic = useSummaryStore((s) => s.topic)
  const assignment = useSummaryStore((s) => s.assignment)
  const revealState = useSummaryStore((s) => s.revealState)

  const [copied, setCopied] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'social' | 'embed'>('social')
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
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Share This Debate</h2>
        <p className="text-muted-foreground">
          Share with friends and see if they can guess which AI argued which side
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <button
          onClick={() => handleShare('copy')}
          className={cn(
            'group flex items-center gap-3 rounded-full px-5 py-2.5',
            'transition-all duration-200 cursor-pointer',
            copied
              ? 'bg-emerald-500/10 border border-emerald-500/30'
              : 'bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.12]'
          )}
        >
          <p
            className={cn(
              'text-sm font-mono max-w-[220px] sm:max-w-sm truncate transition-colors',
              copied ? 'text-emerald-500' : 'text-foreground/70'
            )}
          >
            {fullUrl}
          </p>
          {copied ? (
            <svg
              className="w-4 h-4 text-emerald-500 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-foreground/50 group-hover:text-foreground/70 transition-colors shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>

        {canNativeShare && (
          <button
            onClick={() => handleShare('native')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full',
              'bg-white/[0.03] text-foreground/80',
              'border border-white/[0.08]',
              'hover:bg-white/[0.06] hover:text-foreground',
              'transition-all duration-200'
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
            <span className="text-sm font-medium">Share</span>
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        <div className="relative flex items-center p-1 rounded-full bg-white/[0.02] border border-white/[0.08] mb-5">
          <div
            className="absolute top-1 bottom-1 rounded-full bg-white/[0.08]"
            style={{
              left: activeTab === 'social' ? '4px' : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
              transition: 'left 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
          <button
            onClick={() => setActiveTab('social')}
            className={cn(
              'relative z-10 px-5 py-1.5 rounded-full text-sm transition-colors duration-200 cursor-pointer',
              activeTab === 'social'
                ? 'text-foreground'
                : 'text-foreground/60 hover:text-foreground/80'
            )}
          >
            Social
          </button>
          <button
            onClick={() => setActiveTab('embed')}
            className={cn(
              'relative z-10 px-5 py-1.5 rounded-full text-sm transition-colors duration-200 cursor-pointer',
              activeTab === 'embed'
                ? 'text-foreground'
                : 'text-foreground/60 hover:text-foreground/80'
            )}
          >
            Embed
          </button>
        </div>

        <div className="relative w-full overflow-hidden">
          <div
            className="flex w-[200%] items-start"
            style={{
              transform: activeTab === 'embed' ? 'translateX(-50%)' : 'translateX(0)',
              transition: 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div className="w-1/2 flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleShare('twitter')}
                className="cursor-pointer hover:scale-110 transition-transform duration-300 ease-out"
                aria-label="Share on X"
              >
                <SocialIcon network="x" style={{ height: 40, width: 40 }} />
              </button>

              <button
                onClick={() => handleShare('linkedin')}
                className="cursor-pointer hover:scale-110 transition-transform duration-300 ease-out"
                aria-label="Share on LinkedIn"
              >
                <SocialIcon network="linkedin" style={{ height: 40, width: 40 }} />
              </button>

              <button
                onClick={() => handleShare('facebook')}
                className="cursor-pointer hover:scale-110 transition-transform duration-300 ease-out"
                aria-label="Share on Facebook"
              >
                <SocialIcon network="facebook" style={{ height: 40, width: 40 }} />
              </button>

              <button
                onClick={() => handleShare('reddit')}
                className="cursor-pointer hover:scale-110 transition-transform duration-300 ease-out"
                aria-label="Share on Reddit"
              >
                <SocialIcon network="reddit" style={{ height: 40, width: 40 }} />
              </button>
            </div>

            <div className="w-1/2 flex items-start justify-center px-4 pt-2">
              <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                <p className="text-sm font-medium mb-2 text-foreground/80 text-center">
                  Embed this debate on your site:
                </p>
                <pre className="text-xs bg-black/20 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono text-foreground/70">
                  {embedCode}
                </pre>
                <div className="flex justify-center mt-3">
                  <button
                    onClick={handleCopyEmbed}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full text-sm',
                      'transition-all duration-200',
                      embedCopied
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500'
                        : 'bg-white/[0.03] border border-white/[0.08] text-foreground/80 hover:bg-white/[0.06] hover:text-foreground'
                    )}
                  >
                    {embedCopied ? 'Copied!' : 'Copy Embed Code'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
