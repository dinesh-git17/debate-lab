// bundle-config.ts
/**
 * Bundle optimization configuration and utilities.
 * Defines performance budgets, dynamic import paths, and chunk analysis.
 */

import type { PerformanceBudget } from '@/types/performance'

export const PERFORMANCE_BUDGETS: PerformanceBudget[] = [
  { metric: 'initial-js', budget: 100, unit: 'kb' },
  { metric: 'initial-css', budget: 30, unit: 'kb' },
  { metric: 'total-js', budget: 300, unit: 'kb' },
  { metric: 'lcp', budget: 2500, unit: 'ms' },
  { metric: 'fid', budget: 100, unit: 'ms' },
  { metric: 'cls', budget: 0.1, unit: 'score' },
  { metric: 'ttfb', budget: 800, unit: 'ms' },
]

export const HEAVY_MODULES = [
  'pdf-lib',
  'pdfmake',
  'jspdf',
  'chart.js',
  'three',
  'd3',
  'monaco-editor',
  'codemirror',
] as const

// Dynamic import paths for heavy components (add paths when components exist)
export const DYNAMIC_IMPORT_PATHS = {
  PdfExporter: '@/components/features/export/pdf-exporter',
  MarkdownExporter: '@/components/features/export/markdown-exporter',
  DebateAnalytics: '@/components/features/analytics/debate-analytics',
  ShareModal: '@/components/features/share/share-modal',
  RulesExplorer: '@/components/features/config/rules-explorer',
} as const

export const PREFETCH_ROUTES = ['/debate/new', '/how-it-works', '/about'] as const

export const CRITICAL_ROUTES = ['/', '/debate/new', '/debate/[id]'] as const

export function shouldDynamicImport(componentName: string): boolean {
  return componentName in DYNAMIC_IMPORT_PATHS
}

export function getChunkName(componentPath: string): string {
  const parts = componentPath.split('/')
  const fileName = parts[parts.length - 1]
  return fileName?.replace(/\.(tsx?|jsx?)$/, '') ?? ''
}

export function estimateModuleSize(moduleName: string): 'small' | 'medium' | 'large' {
  const largeModules = ['pdf-lib', 'pdfmake', 'three', 'd3', 'monaco-editor']
  const mediumModules = ['chart.js', 'codemirror', 'prismjs', 'highlight.js']

  if (largeModules.includes(moduleName)) return 'large'
  if (mediumModules.includes(moduleName)) return 'medium'
  return 'small'
}

export const EXTERNAL_PACKAGES = ['openai', '@anthropic-ai/sdk', 'pino', 'pino-pretty'] as const

export const BROWSER_EXCLUDE_PACKAGES = [
  'async_hooks',
  'fs',
  'path',
  'crypto',
  'stream',
  'http',
  'https',
  'zlib',
  'net',
  'tls',
] as const
