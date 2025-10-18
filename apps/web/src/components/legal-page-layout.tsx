'use client';

import Link from "next/link"
import { ReactNode } from "react"
import SiteHeader from "./site-header"

interface LegalPageLayoutProps {
  title: string
  lastUpdated: string
  children: ReactNode
}

export default function LegalPageLayout({ title, lastUpdated, children }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F5F3]">
      {/* Header */}
      <SiteHeader />

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-lg shadow-sm border border-[rgba(55,50,47,0.08)] p-8 md:p-12">
          {/* Header */}
          <header className="mb-8 pb-8 border-b border-[rgba(55,50,47,0.12)]">
            <h1 className="text-4xl md:text-5xl font-semibold text-[#37322F] font-serif mb-4">
              {title}
            </h1>
            <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
              Last Updated: {lastUpdated}
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-slate max-w-none">
            <style jsx global>{`
              .prose h2 {
                font-family: var(--font-serif);
                font-size: 2rem;
                font-weight: 600;
                color: #37322F;
                margin-top: 2.5rem;
                margin-bottom: 1rem;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid rgba(55, 50, 47, 0.12);
              }
              .prose h3 {
                font-family: var(--font-sans);
                font-size: 1.5rem;
                font-weight: 600;
                color: #37322F;
                margin-top: 2rem;
                margin-bottom: 0.75rem;
              }
              .prose h4 {
                font-family: var(--font-sans);
                font-size: 1.25rem;
                font-weight: 600;
                color: #49423D;
                margin-top: 1.5rem;
                margin-bottom: 0.5rem;
              }
              .prose p {
                font-family: var(--font-sans);
                line-height: 1.75;
                color: rgba(55, 50, 47, 0.90);
                margin-bottom: 1rem;
              }
              .prose ul, .prose ol {
                font-family: var(--font-sans);
                color: rgba(55, 50, 47, 0.90);
                margin-left: 1.5rem;
                margin-bottom: 1rem;
              }
              .prose li {
                margin-bottom: 0.5rem;
              }
              .prose a {
                color: #37322F;
                text-decoration: underline;
                text-underline-offset: 2px;
              }
              .prose a:hover {
                color: #49423D;
              }
              .prose strong {
                font-weight: 600;
                color: #37322F;
              }
              .prose code {
                background: rgba(55, 50, 47, 0.08);
                padding: 0.125rem 0.375rem;
                border-radius: 0.25rem;
                font-size: 0.875em;
                font-family: monospace;
              }
              .prose pre {
                background: rgba(55, 50, 47, 0.04);
                border: 1px solid rgba(55, 50, 47, 0.12);
                border-radius: 0.5rem;
                padding: 1rem;
                overflow-x: auto;
                margin-bottom: 1rem;
              }
              .prose table {
                width: 100%;
                border-collapse: collapse;
                margin: 1.5rem 0;
              }
              .prose th {
                background: rgba(55, 50, 47, 0.04);
                font-weight: 600;
                text-align: left;
                padding: 0.75rem;
                border: 1px solid rgba(55, 50, 47, 0.12);
              }
              .prose td {
                padding: 0.75rem;
                border: 1px solid rgba(55, 50, 47, 0.12);
              }
              .prose blockquote {
                border-left: 4px solid rgba(55, 50, 47, 0.20);
                padding-left: 1rem;
                margin-left: 0;
                font-style: italic;
                color: rgba(55, 50, 47, 0.70);
              }
            `}</style>
            {children}
          </div>

          {/* Related Links */}
          <footer className="mt-12 pt-8 border-t border-[rgba(55,50,47,0.12)]">
            <h3 className="text-sm font-semibold text-[rgba(55,50,47,0.60)] font-sans uppercase tracking-wider mb-4">
              Related Documents
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/legal/privacy"
                className="text-sm text-[#37322F] hover:text-[#49423D] underline underline-offset-2 font-sans"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/legal/terms"
                className="text-sm text-[#37322F] hover:text-[#49423D] underline underline-offset-2 font-sans"
              >
                Terms of Service
              </Link>
              <Link 
                href="/legal/security"
                className="text-sm text-[#37322F] hover:text-[#49423D] underline underline-offset-2 font-sans"
              >
                Security
              </Link>
              <Link 
                href="/legal/cookies"
                className="text-sm text-[#37322F] hover:text-[#49423D] underline underline-offset-2 font-sans"
              >
                Cookie Policy
              </Link>
              <Link 
                href="/legal/dpa"
                className="text-sm text-[#37322F] hover:text-[#49423D] underline underline-offset-2 font-sans"
              >
                DPA
              </Link>
            </div>
          </footer>
        </article>

        {/* Contact Section */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-[rgba(55,50,47,0.08)]">
          <h3 className="text-lg font-semibold text-[#37322F] font-sans mb-2">
            Questions?
          </h3>
          <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans mb-4">
            For questions about this document or Saturn's practices, please contact us:
          </p>
          <div className="flex flex-wrap gap-4 text-sm font-sans">
            <a href="mailto:support@saturnmonitor.com" className="text-[#37322F] hover:text-[#49423D] underline underline-offset-2">
              support@saturnmonitor.com
            </a>
            <a href="mailto:legal@saturnmonitor.com" className="text-[#37322F] hover:text-[#49423D] underline underline-offset-2">
              legal@saturnmonitor.com
            </a>
            <a href="mailto:security@saturnmonitor.com" className="text-[#37322F] hover:text-[#49423D] underline underline-offset-2">
              security@saturnmonitor.com
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}

