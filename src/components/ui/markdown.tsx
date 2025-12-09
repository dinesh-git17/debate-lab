// src/components/ui/markdown.tsx

'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

import type { Components } from 'react-markdown'

interface MarkdownProps {
  content: string
  className?: string
}

const components: Components = {
  // Headings
  h1: ({ children }) => <h1 className="mb-4 mt-6 text-2xl font-bold first:mt-0">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 mt-5 text-xl font-bold first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 mt-4 text-lg font-semibold first:mt-0">{children}</h3>,
  h4: ({ children }) => (
    <h4 className="mb-2 mt-3 text-base font-semibold first:mt-0">{children}</h4>
  ),

  // Paragraphs
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,

  // Lists
  ul: ({ children }) => <ul className="mb-3 ml-6 list-disc last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 ml-6 list-decimal last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),

  // Code
  code: ({ className, children }) => {
    const isInline = !className
    if (isInline) {
      return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">{children}</code>
    }
    return (
      <code
        className={cn('block overflow-x-auto rounded bg-muted p-3 font-mono text-sm', className)}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded bg-muted p-3 last:mb-0">{children}</pre>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:text-primary/80"
    >
      {children}
    </a>
  ),

  // Strong and emphasis
  strong: ({ children }) => <strong className="font-medium text-zinc-100">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,

  // Horizontal rule
  hr: () => <hr className="my-4 border-border" />,

  // Tables
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="min-w-full border-collapse border border-border">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
  th: ({ children }) => (
    <th className="border border-border px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border border-border px-3 py-2">{children}</td>,
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn('prose-sm prose-neutral dark:prose-invert max-w-none', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
