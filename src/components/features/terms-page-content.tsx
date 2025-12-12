// terms-page-content.tsx
/**
 * Complete terms of service page with animated sections.
 * Covers acceptable use, content policies, and legal disclaimers.
 */
'use client'

import { motion } from 'framer-motion'
import { Check, Mail, X } from 'lucide-react'
import Link from 'next/link'
import { useRef } from 'react'

import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { useInView } from '@/hooks/use-in-view'

// Apple-style easing curve
const appleEase = [0.16, 1, 0.3, 1] as const

const LAST_UPDATED = 'November 28, 2025'
const EFFECTIVE_DATE = 'November 28, 2025'

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
function TermsSection({
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
function TermsListItem({
  children,
  index,
  isInView,
  variant = 'default',
}: {
  children: React.ReactNode
  index: number
  isInView: boolean
  variant?: 'default' | 'prohibited'
}) {
  const isProhibited = variant === 'prohibited'

  return (
    <motion.li
      className={`flex items-start gap-3 rounded-xl px-4 py-3 backdrop-blur-sm border transition-colors duration-200 ${
        isProhibited
          ? 'border-red-200 bg-red-50/50 hover:border-red-300 hover:bg-red-100/50 dark:border-red-500/15 dark:bg-red-500/[0.03] dark:hover:border-red-500/25 dark:hover:bg-red-500/[0.06]'
          : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-100/50 dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04]'
      }`}
      variants={listItemVariants}
      custom={index}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
          isProhibited
            ? 'bg-red-100 ring-1 ring-red-200 dark:bg-red-500/10 dark:ring-red-500/20'
            : 'bg-primary/10 ring-1 ring-primary/20'
        }`}
      >
        {isProhibited ? (
          <X className="h-3 w-3 text-red-500 dark:text-red-400" aria-hidden="true" />
        ) : (
          <Check className="h-3 w-3 text-primary" aria-hidden="true" />
        )}
      </span>
      <span className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
        {children}
      </span>
    </motion.li>
  )
}

// List with inView detection
function TermsList({
  items,
  variant = 'default',
}: {
  items: React.ReactNode[]
  variant?: 'default' | 'prohibited'
}) {
  const listRef = useRef<HTMLUListElement>(null)
  const isInView = useInView(listRef, { threshold: 0.1, once: true })

  return (
    <ul ref={listRef} className="mt-4 space-y-2">
      {items.map((item, index) => (
        <TermsListItem key={index} index={index} isInView={isInView} variant={variant}>
          {item}
        </TermsListItem>
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
          If you have any questions about these Terms of Service, please contact us:
        </p>

        {/* Frosted contact card */}
        <motion.a
          href="mailto:legal@debatelab.ai"
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
              legal@debatelab.ai
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
          href="/privacy"
          className="font-medium text-neutral-700 underline-offset-4 transition-colors duration-200 hover:text-[#0077ff] hover:underline dark:text-foreground dark:hover:text-white"
        >
          Privacy Policy
        </Link>
      </motion.p>
    </footer>
  )
}

export function TermsPageContent() {
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
                Terms of Service
              </motion.h1>

              {/* Last updated date */}
              <motion.p
                className="mt-5 text-lg leading-relaxed text-neutral-600 dark:text-muted-foreground"
                variants={dateVariants}
              >
                Last updated: {LAST_UPDATED} | Effective: {EFFECTIVE_DATE}
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
              <TermsSection id="introduction" title="Introduction" first>
                <div className="space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  <p>
                    Welcome to Debate Lab. These Terms of Service (&quot;Terms&quot;) govern your
                    access to and use of the Debate Lab website and services (collectively, the
                    &quot;Service&quot;). By accessing or using the Service, you agree to be bound
                    by these Terms.
                  </p>
                  <p>
                    Please read these Terms carefully before using Debate Lab. If you do not agree
                    to these Terms, you may not access or use the Service.
                  </p>
                  <p>
                    Debate Lab is a platform that facilitates AI-powered debates between large
                    language models on topics you choose, with AI moderation and judging. The
                    Service is provided for entertainment and educational purposes.
                  </p>
                </div>
              </TermsSection>

              {/* Definitions */}
              <TermsSection id="definitions" title="Definitions">
                <TermsList
                  items={[
                    <>
                      <strong className="text-neutral-800 dark:text-foreground/90">
                        &quot;Service&quot;
                      </strong>{' '}
                      — The Debate Lab website, application, and all related services
                    </>,
                    <>
                      <strong className="text-neutral-800 dark:text-foreground/90">
                        &quot;User,&quot; &quot;you,&quot; or &quot;your&quot;
                      </strong>{' '}
                      — The individual accessing or using the Service
                    </>,
                    <>
                      <strong className="text-neutral-800 dark:text-foreground/90">
                        &quot;We,&quot; &quot;us,&quot; or &quot;our&quot;
                      </strong>{' '}
                      — Debate Lab and its operators
                    </>,
                    <>
                      <strong className="text-neutral-800 dark:text-foreground/90">
                        &quot;Content&quot;
                      </strong>{' '}
                      — Text, data, information, and other materials submitted to or generated by
                      the Service
                    </>,
                    <>
                      <strong className="text-neutral-800 dark:text-foreground/90">
                        &quot;Debate&quot;
                      </strong>{' '}
                      — An AI-generated discussion between language models on a specified topic
                    </>,
                    <>
                      <strong className="text-neutral-800 dark:text-foreground/90">
                        &quot;AI Models&quot;
                      </strong>{' '}
                      — Third-party large language models used to generate debate content
                    </>,
                  ]}
                />
              </TermsSection>

              {/* Account & Access */}
              <TermsSection id="account-access" title="Account & Access">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    Debate Lab currently does not require account registration. Access is provided
                    through session-based identification. By using the Service, you agree to:
                  </p>
                  <TermsList
                    items={[
                      'Use the Service only for lawful purposes',
                      'Not attempt to bypass any access restrictions or rate limits',
                      'Not impersonate others or misrepresent your identity',
                      'Not use automated systems to access the Service without permission',
                      'Maintain the security of any session identifiers',
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    We reserve the right to restrict or terminate access to any user who violates
                    these Terms or uses the Service in a manner we deem harmful.
                  </p>
                </div>
              </TermsSection>

              {/* Acceptable Use */}
              <TermsSection id="acceptable-use" title="Acceptable Use">
                <div className="space-y-6">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    You agree to use Debate Lab responsibly and ethically. The following uses are
                    strictly prohibited:
                  </p>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-neutral-800 dark:text-foreground/90">
                      Prohibited Content
                    </h3>
                    <TermsList
                      variant="prohibited"
                      items={[
                        'Content that promotes violence, hatred, or discrimination',
                        'Illegal content or content that facilitates illegal activities',
                        'Sexually explicit or pornographic content',
                        'Content that harasses, threatens, or bullies others',
                        'Misinformation intended to deceive or cause harm',
                        'Content that infringes on intellectual property rights',
                        'Malicious content including malware or phishing attempts',
                      ]}
                    />
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-neutral-800 dark:text-foreground/90">
                      Prohibited Activities
                    </h3>
                    <TermsList
                      variant="prohibited"
                      items={[
                        'Attempting to manipulate or "jailbreak" AI models',
                        'Circumventing content filters or safety measures',
                        'Scraping, mining, or extracting data from the Service',
                        'Reverse engineering or decompiling any part of the Service',
                        'Interfering with or disrupting the Service infrastructure',
                        'Using the Service to generate spam or bulk content',
                        'Reselling or commercially exploiting the Service without permission',
                      ]}
                    />
                  </div>
                </div>
              </TermsSection>

              {/* Debate Content */}
              <TermsSection id="debate-content" title="Debate Content">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    When you submit a debate topic to Debate Lab:
                  </p>
                  <TermsList
                    items={[
                      'You are responsible for ensuring the topic is appropriate and lawful',
                      'Topics are subject to automated content filtering',
                      'We may reject or modify topics that violate our policies',
                      'Custom rules you provide must comply with acceptable use policies',
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    Debate Lab is designed for constructive discourse. We encourage topics that are
                    thought-provoking, educational, or entertaining, while discouraging topics
                    designed to generate harmful or offensive content.
                  </p>
                </div>
              </TermsSection>

              {/* AI-Generated Content */}
              <TermsSection id="ai-generated-content" title="AI-Generated Content">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    All debate content is generated by artificial intelligence. You acknowledge and
                    agree that:
                  </p>
                  <TermsList
                    items={[
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          No guarantee of accuracy
                        </strong>{' '}
                        — AI-generated content may contain errors, inaccuracies, or fabricated
                        information
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Not professional advice
                        </strong>{' '}
                        — Content should not be relied upon as legal, medical, financial, or other
                        professional advice
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Not our views
                        </strong>{' '}
                        — Arguments presented by AI models do not represent the views or opinions of
                        Debate Lab
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          May be biased
                        </strong>{' '}
                        — AI models may exhibit biases present in their training data
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Subject to change
                        </strong>{' '}
                        — The same topic may produce different results on different occasions
                      </>,
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    You are solely responsible for how you use or rely on AI-generated content from
                    Debate Lab.
                  </p>
                </div>
              </TermsSection>

              {/* Intellectual Property */}
              <TermsSection id="intellectual-property" title="Intellectual Property">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-base font-medium text-neutral-800 dark:text-foreground/90">
                      Our Intellectual Property
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                      The Service, including its design, features, and original content, is owned by
                      Debate Lab and protected by copyright, trademark, and other intellectual
                      property laws. You may not copy, modify, distribute, or create derivative
                      works without our explicit permission.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-3 text-base font-medium text-neutral-800 dark:text-foreground/90">
                      AI-Generated Content Ownership
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                      The intellectual property status of AI-generated content is evolving. For
                      debates generated through Debate Lab, you may use the output for personal,
                      non-commercial purposes. Commercial use requires explicit permission.
                    </p>
                  </div>
                </div>
              </TermsSection>

              {/* User Content */}
              <TermsSection id="user-content" title="User Content">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    When you submit content to Debate Lab (such as debate topics or custom rules):
                  </p>
                  <TermsList
                    items={[
                      'You retain ownership of the content you submit',
                      'You grant us a license to use, process, and transmit your content as necessary to provide the Service',
                      "You represent that you have the right to submit the content and that it does not infringe on others' rights",
                      'You are responsible for any content you submit and its consequences',
                    ]}
                  />
                </div>
              </TermsSection>

              {/* Third-Party Services */}
              <TermsSection id="third-party-services" title="Third-Party Services">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    Debate Lab relies on third-party services to function, including:
                  </p>
                  <TermsList
                    items={[
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">OpenAI</strong>{' '}
                        — GPT models for debate generation
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Anthropic
                        </strong>{' '}
                        — Claude models for moderation and judging
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">xAI</strong> —
                        Grok models for debate generation
                      </>,
                      <>
                        <strong className="text-neutral-800 dark:text-foreground/90">
                          Cloud providers
                        </strong>{' '}
                        — Hosting and infrastructure services
                      </>,
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    Your use of the Service is also subject to the terms and policies of these
                    third-party providers. We are not responsible for the availability, accuracy, or
                    conduct of third-party services.
                  </p>
                </div>
              </TermsSection>

              {/* Disclaimers */}
              <TermsSection id="disclaimers" title="Disclaimers">
                <div className="space-y-4">
                  <p className="text-sm font-medium leading-relaxed text-neutral-800 dark:text-white/85">
                    THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT
                    WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                  </p>
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    We specifically disclaim:
                  </p>
                  <TermsList
                    items={[
                      'Warranties of merchantability and fitness for a particular purpose',
                      'Warranties that the Service will be uninterrupted or error-free',
                      'Warranties regarding the accuracy or reliability of AI-generated content',
                      'Warranties that the Service will meet your specific requirements',
                      'Warranties regarding the security of data transmission',
                    ]}
                  />
                </div>
              </TermsSection>

              {/* Limitation of Liability */}
              <TermsSection id="limitation-of-liability" title="Limitation of Liability">
                <div className="space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  <p className="font-medium text-neutral-800 dark:text-white/85">
                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEBATE LAB SHALL NOT BE LIABLE FOR ANY
                    INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
                  </p>
                  <p>
                    This includes, but is not limited to, damages for loss of profits, data,
                    goodwill, or other intangible losses resulting from your use or inability to use
                    the Service, even if we have been advised of the possibility of such damages.
                  </p>
                  <p>
                    Our total liability for any claims arising from these Terms or the Service shall
                    not exceed the amount you paid us, if any, in the twelve months preceding the
                    claim.
                  </p>
                </div>
              </TermsSection>

              {/* Indemnification */}
              <TermsSection id="indemnification" title="Indemnification">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    You agree to indemnify, defend, and hold harmless Debate Lab and its operators,
                    employees, and affiliates from any claims, damages, losses, liabilities, and
                    expenses (including legal fees) arising from:
                  </p>
                  <TermsList
                    items={[
                      'Your use of the Service',
                      'Your violation of these Terms',
                      'Your violation of any rights of another party',
                      'Content you submit to the Service',
                    ]}
                  />
                </div>
              </TermsSection>

              {/* Termination */}
              <TermsSection id="termination" title="Termination">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    We may terminate or suspend your access to the Service immediately, without
                    prior notice, for any reason, including:
                  </p>
                  <TermsList
                    items={[
                      'Violation of these Terms',
                      'Conduct that we believe is harmful to other users or the Service',
                      'Request by law enforcement or government agencies',
                      'Discontinuation or modification of the Service',
                    ]}
                  />
                  <p className="text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                    Upon termination, your right to use the Service will immediately cease.
                    Provisions of these Terms that by their nature should survive termination shall
                    survive, including ownership, disclaimers, indemnification, and limitations of
                    liability.
                  </p>
                </div>
              </TermsSection>

              {/* Governing Law */}
              <TermsSection id="governing-law" title="Governing Law">
                <div className="space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  <p>
                    These Terms shall be governed by and construed in accordance with the laws of
                    the jurisdiction in which Debate Lab operates, without regard to conflict of law
                    principles.
                  </p>
                  <p>
                    Any disputes arising from these Terms or the Service shall be resolved through
                    binding arbitration in accordance with applicable arbitration rules, except
                    where prohibited by law.
                  </p>
                </div>
              </TermsSection>

              {/* Changes to Terms */}
              <TermsSection id="changes-to-terms" title="Changes to Terms">
                <div className="space-y-4 text-sm leading-relaxed text-neutral-700 dark:text-white/85">
                  <p>
                    We reserve the right to modify these Terms at any time. We will notify users of
                    material changes by posting the updated Terms on this page and updating the
                    &quot;Last updated&quot; date. Your continued use of the Service after changes
                    become effective constitutes acceptance of the revised Terms.
                  </p>
                  <p>We encourage you to review these Terms periodically for any changes.</p>
                </div>
              </TermsSection>

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
