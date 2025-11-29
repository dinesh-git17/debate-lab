// src/components/features/privacy-page-content.tsx
'use client'

import { motion } from 'framer-motion'
import { Check, Mail } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

const LAST_UPDATED = 'November 28, 2025'

// Animation variants for hero
const heroContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

const titleVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: appleEase,
    },
  },
}

const dateVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: appleEase,
    },
  },
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: appleEase,
    },
  },
}

const listItemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: appleEase,
      delay: 0.1 + i * 0.06,
    },
  }),
}

// Reusable animated section component
function PolicySection({
  id,
  title,
  children,
  first = false,
}: {
  id: string
  title: string
  children: React.ReactNode
  first?: boolean
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })

  return (
    <section ref={sectionRef} id={id} className="scroll-mt-24">
      {/* Section divider - hidden for first section */}
      {!first && (
        <motion.div
          className="mx-auto mb-8 h-px max-w-xs bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:from-transparent dark:via-white/10 dark:to-transparent"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
          transition={{ duration: 0.6, ease: appleEase }}
        />
      )}

      <motion.h2
        className="mb-6 text-center text-2xl font-semibold tracking-tight text-neutral-800 dark:text-foreground"
        variants={sectionVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {title}
      </motion.h2>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        transition={{ delay: 0.1 }}
      >
        {children}
      </motion.div>
    </section>
  )
}

// Premium list item component
function PolicyListItem({
  children,
  index,
  isInView,
}: {
  children: React.ReactNode
  index: number
  isInView: boolean
}) {
  return (
    <motion.li
      className="flex items-start gap-3 rounded-xl px-4 py-3 backdrop-blur-sm border transition-colors duration-200 border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-100/50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]"
      variants={listItemVariants}
      custom={index}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <Check className="h-3 w-3 text-primary" aria-hidden="true" />
      </span>
      <span className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
        {children}
      </span>
    </motion.li>
  )
}

// List with inView detection
function PolicyList({ items }: { items: React.ReactNode[] }) {
  const listRef = useRef<HTMLUListElement>(null)
  const isInView = useInView(listRef, { threshold: 0.1, once: true })

  return (
    <ul ref={listRef} className="mt-4 space-y-2">
      {items.map((item, index) => (
        <PolicyListItem key={index} index={index} isInView={isInView}>
          {item}
        </PolicyListItem>
      ))}
    </ul>
  )
}

// Contact section with frosted card
function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.1, once: true })

  return (
    <section ref={sectionRef} id="contact" className="scroll-mt-24">
      {/* Section divider */}
      <motion.div
        className="mx-auto mb-8 h-px max-w-xs bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:from-transparent dark:via-white/10 dark:to-transparent"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ duration: 0.6, ease: appleEase }}
      />

      <motion.h2
        className="mb-6 text-center text-2xl font-semibold tracking-tight text-neutral-800 dark:text-foreground"
        variants={sectionVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        Contact Us
      </motion.h2>

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        transition={{ delay: 0.1 }}
      >
        <p className="mb-6 text-center text-sm leading-relaxed text-neutral-600 dark:text-white/85">
          If you have any questions about this Privacy Policy or our data practices, please contact
          us:
        </p>

        {/* Frosted contact card */}
        <motion.a
          href="mailto:privacy@debatelab.ai"
          className="group mx-auto flex max-w-sm items-center justify-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50/50 px-6 py-4 backdrop-blur-sm transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-100/50 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-white/[0.15] dark:hover:bg-white/[0.05]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-muted-foreground">
              Email
            </p>
            <p className="text-sm font-medium text-neutral-800 transition-colors duration-200 group-hover:text-[#0077ff] dark:text-foreground dark:group-hover:text-white">
              privacy@debatelab.ai
            </p>
          </div>
        </motion.a>
      </motion.div>
    </section>
  )
}

// Footer section
function FooterSection() {
  const footerRef = useRef<HTMLElement>(null)
  const isInView = useInView(footerRef, { threshold: 0.1, once: true })

  return (
    <footer ref={footerRef} className="pt-8">
      {/* Final divider */}
      <motion.div
        className="mx-auto mb-6 h-px max-w-xs bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:from-transparent dark:via-white/10 dark:to-transparent"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={isInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
        transition={{ duration: 0.6, ease: appleEase }}
      />

      <motion.p
        className="text-center text-sm text-neutral-500 dark:text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, ease: appleEase, delay: 0.1 }}
      >
        See also:{' '}
        <Link
          href="/terms"
          className="font-medium text-neutral-700 underline-offset-4 transition-colors duration-200 hover:text-[#0077ff] hover:underline dark:text-foreground dark:hover:text-white"
        >
          Terms of Service
        </Link>
      </motion.p>
    </footer>
  )
}

export function PrivacyPageContent() {
  const heroRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { threshold: 0.1, once: true })

  return (
    <>
      {/* Hero Section */}
      <div ref={heroRef}>
        <Section className="relative overflow-hidden pt-28 pb-10 md:pt-36 md:pb-12 lg:pt-40 lg:pb-14">
          {/* Ambient radial glow - subtle, cool-tinted, massive */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <motion.div
              className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.2, ease: appleEase }}
              style={{
                width: '1800px',
                height: '1200px',
                background:
                  'radial-gradient(ellipse at center, rgba(120, 150, 255, 0.03) 0%, transparent 70%)',
              }}
            />
          </div>

          <Container>
            <motion.div
              className="mx-auto max-w-3xl text-center"
              variants={heroContainerVariants}
              initial="hidden"
              animate={heroInView ? 'visible' : 'hidden'}
            >
              {/* Eyebrow label */}
              <motion.p
                className="mb-4 text-sm font-medium uppercase tracking-widest text-neutral-500 dark:text-muted-foreground/70"
                variants={titleVariants}
              >
                Legal
              </motion.p>

              {/* Title */}
              <motion.h1
                className="text-4xl font-semibold tracking-tight text-neutral-900 dark:text-foreground sm:text-5xl lg:text-6xl"
                variants={titleVariants}
              >
                Privacy Policy
              </motion.h1>

              {/* Last updated date */}
              <motion.p
                className="mt-5 text-lg leading-relaxed text-neutral-600 dark:text-muted-foreground"
                variants={dateVariants}
              >
                Last updated: {LAST_UPDATED}
              </motion.p>
            </motion.div>

            {/* Thin line divider */}
            <motion.div
              className="mx-auto mt-10 h-px w-24 bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:from-transparent dark:via-white/15 dark:to-transparent md:mt-12"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={heroInView ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.8, ease: appleEase, delay: 0.5 }}
            />
          </Container>
        </Section>
      </div>

      {/* Main Content */}
      <Section className="pt-8 pb-12 md:pt-10 md:pb-16 lg:pt-8">
        <Container>
          <div className="mx-auto max-w-[65ch]">
            <article className="space-y-12">
              {/* Introduction */}
              <PolicySection id="introduction" title="Introduction" first>
                <div className="space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  <p>
                    Welcome to Debate Lab. We are committed to protecting your privacy and ensuring
                    transparency about how we handle your data. This Privacy Policy explains what
                    information we collect, how we use it, and your rights regarding your personal
                    data.
                  </p>
                  <p>
                    Debate Lab is a platform where AI models engage in structured debates on topics
                    you choose. By using our service, you agree to the collection and use of
                    information in accordance with this policy.
                  </p>
                </div>
              </PolicySection>

              {/* Information We Collect */}
              <PolicySection id="information-we-collect" title="Information We Collect">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-base font-medium text-neutral-800 dark:text-foreground/90">
                      Information You Provide
                    </h3>
                    <PolicyList
                      items={[
                        'Debate topics and custom rules you submit',
                        'Configuration preferences (number of turns, debate format)',
                        'Feedback and communications you send to us',
                      ]}
                    />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-neutral-800 dark:text-foreground/90">
                      Information Collected Automatically
                    </h3>
                    <PolicyList
                      items={[
                        'Device information (browser type, operating system)',
                        'IP address and approximate location',
                        'Usage data (pages visited, features used, time spent)',
                        'Session identifiers',
                      ]}
                    />
                  </div>
                </div>
              </PolicySection>

              {/* How We Use Your Information */}
              <PolicySection id="how-we-use-information" title="How We Use Your Information">
                <p className="mb-4 text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  We use the information we collect to:
                </p>
                <PolicyList
                  items={[
                    'Provide and operate the Debate Lab service',
                    'Generate AI debates based on your submitted topics',
                    'Improve and optimize our platform',
                    'Monitor for abuse and ensure platform security',
                    'Analyze usage patterns to enhance user experience',
                    'Respond to your inquiries and support requests',
                  ]}
                />
              </PolicySection>

              {/* AI & LLM Data Handling */}
              <PolicySection id="ai-data-handling" title="AI & LLM Data Handling">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    Debate Lab uses third-party AI language models to generate debate content.
                    Here&apos;s how your data is handled in this context:
                  </p>
                  <PolicyList
                    items={[
                      'Debate topics you submit are sent to AI providers to generate responses',
                      'We do not use your debate content to train AI models',
                      'AI-generated content is stored temporarily for your session',
                      'Shared debates may be stored longer based on your sharing preferences',
                      'We implement content filtering to prevent misuse',
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    AI providers we use include OpenAI, Anthropic, and xAI. Each provider has their
                    own privacy policies governing how they handle data sent to their APIs.
                  </p>
                </div>
              </PolicySection>

              {/* Data Storage & Security */}
              <PolicySection id="data-storage-security" title="Data Storage & Security">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    We take the security of your data seriously and implement appropriate technical
                    and organizational measures including:
                  </p>
                  <PolicyList
                    items={[
                      'Encryption of data in transit (TLS/HTTPS)',
                      'Secure cloud infrastructure with industry-standard protections',
                      'Regular security assessments and monitoring',
                      'Access controls limiting who can view your data',
                      'Rate limiting and abuse prevention systems',
                    ]}
                  />
                </div>
              </PolicySection>

              {/* Third-Party Services */}
              <PolicySection id="third-party-services" title="Third-Party Services">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    We use the following third-party services to operate Debate Lab:
                  </p>
                  <PolicyList
                    items={[
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">OpenAI</strong>{' '}
                        — Provides GPT models for debate generation
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Anthropic
                        </strong>{' '}
                        — Provides Claude for moderation and judging
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">xAI</strong> —
                        Provides Grok models for debate generation
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">Vercel</strong>{' '}
                        — Hosting and infrastructure
                      </>,
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    Each of these services has their own privacy policy. We encourage you to review
                    their policies to understand how they handle data.
                  </p>
                </div>
              </PolicySection>

              {/* Cookies & Tracking */}
              <PolicySection id="cookies-tracking" title="Cookies & Tracking">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    We use cookies and similar technologies for:
                  </p>
                  <PolicyList
                    items={[
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Essential cookies
                        </strong>{' '}
                        — Required for the service to function (session management, security)
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Preference cookies
                        </strong>{' '}
                        — Remember your settings (theme preference)
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Analytics cookies
                        </strong>{' '}
                        — Help us understand how you use the service (anonymized usage data)
                      </>,
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    You can control cookie preferences through your browser settings. Disabling
                    certain cookies may affect functionality.
                  </p>
                </div>
              </PolicySection>

              {/* Your Rights */}
              <PolicySection id="your-rights" title="Your Rights">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    Depending on your location, you may have the following rights regarding your
                    personal data:
                  </p>
                  <PolicyList
                    items={[
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">Access</strong>{' '}
                        — Request a copy of the data we hold about you
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Correction
                        </strong>{' '}
                        — Request correction of inaccurate data
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Deletion
                        </strong>{' '}
                        — Request deletion of your personal data
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Portability
                        </strong>{' '}
                        — Request a portable copy of your data
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Objection
                        </strong>{' '}
                        — Object to certain processing of your data
                      </>,
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    To exercise any of these rights, please contact us using the information
                    provided in the Contact section below.
                  </p>
                </div>
              </PolicySection>

              {/* Data Retention */}
              <PolicySection id="data-retention" title="Data Retention">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    We retain your data for the following periods:
                  </p>
                  <PolicyList
                    items={[
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Session data
                        </strong>{' '}
                        — Deleted when your session ends or within 24 hours of inactivity
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Debate transcripts
                        </strong>{' '}
                        — Retained for up to 30 days unless you share them
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Shared debates
                        </strong>{' '}
                        — Retained until expiration (24 hours to 1 week based on your selection)
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Usage analytics
                        </strong>{' '}
                        — Aggregated data retained for up to 12 months
                      </>,
                    ]}
                  />
                </div>
              </PolicySection>

              {/* Children's Privacy */}
              <PolicySection id="childrens-privacy" title="Children's Privacy">
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  Debate Lab is not intended for use by children under the age of 13. We do not
                  knowingly collect personal information from children under 13. If you are a parent
                  or guardian and believe your child has provided us with personal information,
                  please contact us immediately.
                </p>
              </PolicySection>

              {/* Changes to This Policy */}
              <PolicySection id="policy-changes" title="Changes to This Policy">
                <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  We may update this Privacy Policy from time to time. We will notify you of any
                  material changes by posting the new policy on this page and updating the
                  &quot;Last updated&quot; date. We encourage you to review this policy periodically
                  for any changes.
                </p>
              </PolicySection>

              {/* Contact Us */}
              <ContactSection />

              {/* Footer */}
              <FooterSection />
            </article>
          </div>
        </Container>
      </Section>
    </>
  )
}
