import type { Metadata } from 'next';
import type React from "react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import SmartSimpleBrilliant from "@/components/smart-simple-brilliant"
import YourWorkInSync from "@/components/your-work-in-sync"
import EffortlessIntegration from "@/components/effortless-integration-updated"
import NumbersThatSpeak from "@/components/numbers-that-speak"
import DocumentationSection from "@/components/documentation-section"
import TestimonialsSection from "@/components/testimonials-section"
import CTASection from "@/components/cta-section"
import FooterSection from "@/components/footer-section"
import { InteractiveHero } from "@/components/landing/interactive-hero"
import { generatePageMetadata } from "@/lib/seo/metadata"
import {
  getOrganizationSchema,
  getWebSiteSchema,
  getSoftwareApplicationSchema,
  getFAQPageSchema,
} from "@/lib/seo/schema"
import { JsonLd } from "@/components/seo/json-ld"

// Lazy load below-fold components for better performance
const FAQSection = dynamic(() => import("@/components/faq-section"), {
  loading: () => <div className="min-h-[400px]" />,
})
const PricingSection = dynamic(() => import("@/components/pricing-section"), {
  loading: () => <div className="min-h-[600px]" />,
})

// SEO Metadata
export const metadata: Metadata = generatePageMetadata({
  title: 'Saturn - Cron Monitoring with Anomaly Detection',
  description: 'Statistical anomaly detection catches slowdowns before failures. Monitor your cron jobs with health scores, MTBF/MTTR analytics, and multi-channel alerts. Built for DevOps teams.',
  keywords: [
    'cron monitoring',
    'cron job monitoring',
    'scheduled job monitoring',
    'kubernetes cronjob monitoring',
    'wordpress wp-cron monitoring',
    'cron anomaly detection',
    'job monitoring',
    'heartbeat monitoring',
    'uptime monitoring',
    'devops monitoring',
    'sre tools',
    'reliability monitoring',
    'health scores',
    'MTBF',
    'MTTR',
    'anomaly detection',
    'slack alerts',
    'discord alerts',
    'z-score analysis',
    'performance monitoring',
  ],
  path: '/',
  ogImage: '/og/default-og.png',
});

// FAQ data for schema markup
const faqData = [
  {
    question: "How does anomaly detection work?",
    answer:
      "Saturn uses Welford's algorithm to calculate incremental mean and variance for each cron job. When a job's runtime deviates 3+ standard deviations from its baseline (Z-Score analysis), you get alerted—even if the job technically succeeded. This catches performance degradation before complete failure.",
  },
  {
    question: "What makes Saturn different from Cronitor or Healthchecks.io?",
    answer:
      "Traditional monitors only tell you pass/fail. Saturn's statistical anomaly detection catches slowdowns before they become failures. We also offer health scoring (A-F grades), MTTR/MTBF analytics, native Kubernetes Helm charts, and a WordPress plugin for bulk wp-cron management.",
  },
  {
    question: "How do I set up monitoring for Kubernetes CronJobs?",
    answer:
      "Use our Helm chart: helm repo add saturn https://charts.saturnmonitor.com && helm install your-monitor saturn/saturn-monitor --set saturn.token=YOUR_TOKEN. The Go sidecar automatically reports job status with zero code changes. Deployment takes under 60 seconds.",
  },
  {
    question: "Does Saturn support WordPress wp-cron monitoring?",
    answer:
      "Yes! Our WordPress plugin is designed for agencies managing hundreds of sites. Install the plugin, add your API token, and monitor all wp-cron jobs from one dashboard. Bulk management, health scoring, and anomaly detection included.",
  },
  {
    question: "What alert channels does Saturn support?",
    answer:
      "Saturn integrates with Email, Slack, Discord, and webhooks. You can configure multiple channels per monitor, set up escalation rules, and customize alert thresholds. All alerts include incident context with acknowledgment and resolution workflows.",
  },
  {
    question: "How is pricing calculated?",
    answer:
      "We have three tiers: Free (5 monitors, 3 team members), Pro ($19/month for 100 monitors, 10 members), and Business ($49/month for 500 monitors, unlimited members). Annual billing saves 20%. All plans include anomaly detection and core features.",
  },
];

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function LandingPage() {
  // Generate JSON-LD schemas
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebSiteSchema();
  const softwareSchema = getSoftwareApplicationSchema();
  const faqSchema = getFAQPageSchema(faqData);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      <JsonLd data={softwareSchema} />
      <JsonLd data={faqSchema} />

      <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
        <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation */}
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]"></div>

              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
                <div className="flex justify-center items-center">
                  <Link href="/" className="flex justify-start items-center cursor-pointer">
                    <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
                      Saturn
                    </div>
                  </Link>
                  <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 flex justify-start items-start hidden sm:flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
                    <a href="#features" className="flex justify-start items-center hover:opacity-60 transition-opacity cursor-pointer">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Features
                      </div>
                    </a>
                    <a href="#pricing" className="flex justify-start items-center hover:opacity-60 transition-opacity cursor-pointer">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Pricing
                      </div>
                    </a>
                    <Link href="https://docs.saturnmonitor.com" target="_blank" rel="noopener noreferrer" className="flex justify-start items-center hover:opacity-60 transition-opacity">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Docs
                      </div>
                    </Link>
                  </div>
                </div>
                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
                  <Link href="/auth/signin">
                    <div className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
                        Log in
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full sm:pl-0 sm:pr-0 pl-0 pr-0">
              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <h1 className="w-full max-w-[748.71px] lg:w-[748.71px] text-center flex justify-center flex-col text-[#37322F] text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-24 font-serif px-2 sm:px-4 md:px-0">
                    Cron Monitoring with
                    <br />
                    Anomaly Detection
                  </h1>
                  <p className="w-full max-w-[506.08px] lg:w-[506.08px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-7 font-sans px-2 sm:px-4 md:px-0 lg:text-lg font-medium text-sm">
                    Statistical anomaly detection catches slowdowns before failures.
                    <br className="hidden sm:block" />
                    Monitor your cron jobs with health scores, MTBF/MTTR analytics, and multi-channel alerts.
                  </p>
                </div>
              </div>

              <div className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                <div className="backdrop-blur-[8.25px] flex justify-start items-center gap-4">
                  <Link href="/auth/signup">
                    <div className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-[#49423D] transition-colors">
                      <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                      <div className="flex flex-col justify-center text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                        Start for free
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:top-[320px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
                <Image
                  src="/mask-group-pattern.svg"
                  alt="Decorative background pattern for Saturn cron monitoring landing page"
                  width={2808}
                  height={1000}
                  className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-30 sm:opacity-40 md:opacity-50 mix-blend-multiply"
                  style={{
                    filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
                  }}
                  unoptimized
                  priority={false}
                  loading="lazy"
                  quality={75}
                />
              </div>

              {/* How It Works Section */}
              <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 md:py-24">
                <div className="text-center mb-12 sm:mb-16">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#37322F] mb-4 sm:mb-6 font-serif">
                    How Cron Monitoring Works
                  </h2>
                  <p className="text-lg sm:text-xl text-[#605A57] max-w-3xl mx-auto leading-relaxed">
                    Saturn uses advanced statistical analysis to detect anomalies in your scheduled jobs before they fail completely. 
                    Our platform monitors performance patterns and alerts you to potential issues.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#37322F] to-[#49423D] rounded-full flex items-center justify-center">
                      <span className="text-2xl text-white font-bold">1</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#37322F] mb-4">Deploy & Monitor</h3>
                    <p className="text-[#605A57] leading-relaxed">
                      Deploy our <Link href="/docs/kubernetes" className="text-[#37322F] hover:underline font-medium">Kubernetes Helm chart</Link> or 
                      <Link href="/docs/wordpress" className="text-[#37322F] hover:underline font-medium"> WordPress plugin</Link> to start monitoring your cron jobs in minutes.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#37322F] to-[#49423D] rounded-full flex items-center justify-center">
                      <span className="text-2xl text-white font-bold">2</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#37322F] mb-4">Statistical Analysis</h3>
                    <p className="text-[#605A57] leading-relaxed">
                      Our Welford algorithm calculates z-scores and establishes performance baselines. 
                      We detect when jobs slow down 3x or more—even if they still succeed.
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-[#37322F] to-[#49423D] rounded-full flex items-center justify-center">
                      <span className="text-2xl text-white font-bold">3</span>
                    </div>
                    <h3 className="text-xl font-semibold text-[#37322F] mb-4">Smart Alerts</h3>
                    <p className="text-[#605A57] leading-relaxed">
                      Get notified via <Link href="/docs/alerts" className="text-[#37322F] hover:underline font-medium">Email, Slack, Discord, or webhooks</Link> 
                      when anomalies are detected. Track incidents and maintain high reliability.
                    </p>
                  </div>
                </div>

                <div className="mt-12 sm:mt-16 text-center">
                  <Link href="/company/about" className="inline-flex items-center text-[#37322F] hover:text-[#49423D] font-medium">
                    Learn more about our technology
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Interactive Hero Carousel and Feature Cards */}
              <div className="w-full" style={{ minHeight: '200px' }}>
                <InteractiveHero />
              </div>

              {/* Social Proof Section */}
              <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
                <div className="self-stretch px-4 sm:px-6 md:px-24 py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
                  <div className="w-full max-w-[586px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
                    <Badge
                      icon={
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="3" width="4" height="6" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="1" width="4" height="8" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="2" y="4" width="1" height="1" fill="#37322F" />
                          <rect x="3.5" y="4" width="1" height="1" fill="#37322F" />
                          <rect x="2" y="5.5" width="1" height="1" fill="#37322F" />
                          <rect x="3.5" y="5.5" width="1" height="1" fill="#37322F" />
                          <rect x="8" y="2" width="1" height="1" fill="#37322F" />
                          <rect x="9.5" y="2" width="1" height="1" fill="#37322F" />
                          <rect x="8" y="3.5" width="1" height="1" fill="#37322F" />
                          <rect x="9.5" y="3.5" width="1" height="1" fill="#37322F" />
                          <rect x="8" y="5" width="1" height="1" fill="#37322F" />
                          <rect x="9.5" y="5" width="1" height="1" fill="#37322F" />
                        </svg>
                      }
                      text="Social Proof"
                    />
                    <h2 className="w-full max-w-[472.55px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
                      Trusted by DevOps teams
                    </h2>
                    <p className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                      Engineering teams prevent failures and reduce MTTR
                      <br className="hidden sm:block" />
                      with proactive anomaly detection for critical cron jobs.
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="self-stretch border-[rgba(55,50,47,0.12)] flex justify-center items-start border-t border-b-0">
                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                    {/* Left decorative pattern */}
                    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                    {/* Stats Grid - Platform capabilities */}
                    {[
                      { label: "Anomaly Detection", sublabel: "Z-Score Analysis" },
                      { label: "Multi-Channel", sublabel: "Slack • Discord • Email" },
                      { label: "Kubernetes", sublabel: "Helm Chart Ready" },
                      { label: "WordPress", sublabel: "wp-cron Plugin" },
                      { label: "Health Scores", sublabel: "A-F Grades" },
                      { label: "MTTR/MTBF", sublabel: "Reliability Metrics" },
                      { label: "Incident Tracking", sublabel: "Ack & Resolve" },
                      { label: "99.9% Uptime", sublabel: "SLA Guaranteed" },
                    ].map((stat, index) => {
                      const isMobileFirstColumn = index % 2 === 0
                      const isDesktopFirstColumn = index % 4 === 0
                      const isDesktopLastColumn = index % 4 === 3
                      const isDesktopTopRow = index < 4
                      const isDesktopBottomRow = index >= 4

                      return (
                        <div
                          key={index}
                          className={`
                            h-24 xs:h-28 sm:h-32 md:h-36 lg:h-40 flex flex-col justify-center items-center gap-1 xs:gap-2 sm:gap-2 px-4
                            border-b border-[rgba(227,226,225,0.5)]
                            ${index < 6 ? "sm:border-b-[0.5px]" : "sm:border-b"}
                            ${index >= 6 ? "border-b" : ""}
                            ${isMobileFirstColumn ? "border-r-[0.5px]" : ""}
                            sm:border-r-[0.5px] sm:border-l-0
                            ${isDesktopFirstColumn ? "md:border-l" : "md:border-l-[0.5px]"}
                            ${isDesktopLastColumn ? "md:border-r" : "md:border-r-[0.5px]"}
                            ${isDesktopTopRow ? "md:border-b-[0.5px]" : ""}
                            ${isDesktopBottomRow ? "md:border-t-[0.5px] md:border-b" : ""}
                            border-[#E3E2E1]
                          `}
                        >
                          <div className="text-center flex justify-center flex-col text-[#37322F] text-sm xs:text-base sm:text-lg md:text-xl font-semibold leading-tight font-sans">
                            {stat.label}
                          </div>
                          <div className="text-center flex justify-center flex-col text-[#605A57] text-xs xs:text-xs sm:text-sm md:text-sm font-normal leading-tight font-sans">
                            {stat.sublabel}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                    {/* Right decorative pattern */}
                    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Grid Section */}
              <div className="w-full border-b border-[rgba(55,50,47,0.12)] flex flex-col justify-center items-center">
                {/* Header Section */}
                <div className="self-stretch px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] py-8 sm:py-12 md:py-16 border-b border-[rgba(55,50,47,0.12)] flex justify-center items-center gap-6">
                  <div className="w-full max-w-[616px] lg:w-[616px] px-4 sm:px-6 py-4 sm:py-5 shadow-[0px_2px_4px_rgba(50,45,43,0.06)] overflow-hidden rounded-lg flex flex-col justify-start items-center gap-3 sm:gap-4 shadow-none">
                    <Badge
                      icon={
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="1" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="1" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="1" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                          <rect x="7" y="7" width="4" height="4" stroke="#37322F" strokeWidth="1" fill="none" />
                        </svg>
                      }
                      text="Bento grid"
                    />
                    <h2 className="w-full max-w-[598.06px] lg:w-[598.06px] text-center flex justify-center flex-col text-[#49423D] text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold leading-tight md:leading-[60px] font-sans tracking-tight">
                      Proactive monitoring that prevents failures
                    </h2>
                    <p className="self-stretch text-center text-[#605A57] text-sm sm:text-base font-normal leading-6 sm:leading-7 font-sans">
                      Go beyond simple ping monitoring with statistical analysis
                      <br />
                      that catches performance issues before they cause outages.
                    </p>
                  </div>
                </div>

                {/* Bento Grid Content */}
                <div className="self-stretch flex justify-center items-start">
                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                    {/* Left decorative pattern */}
                    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 border-l border-r border-[rgba(55,50,47,0.12)]">
                    {/* Top Left - Smart. Simple. Brilliant. */}
                    <div className="border-b border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                          Statistical anomaly detection
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Welford's algorithm tracks incremental mean and variance to establish baselines. Z-Score analysis flags jobs running 3+ standard deviations from normal.
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex items-center justify-center overflow-hidden">
                        <SmartSimpleBrilliant
                          width="100%"
                          height="100%"
                          theme="light"
                          className="scale-50 sm:scale-65 md:scale-75 lg:scale-90"
                        />
                      </div>
                    </div>

                    {/* Top Right - Your work, in sync */}
                    <div className="border-b border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[#37322F] font-semibold leading-tight font-sans text-lg sm:text-xl">
                          Real-time alerts & incidents
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Multi-channel alerts via Email, Slack, Discord, and webhooks. Track incidents with acknowledgment, resolution workflows, and team escalation.
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden text-right items-center justify-center">
                        <YourWorkInSync
                          width="400"
                          height="250"
                          theme="light"
                          className="scale-60 sm:scale-75 md:scale-90"
                        />
                      </div>
                    </div>

                    {/* Bottom Left - Effortless integration */}
                    <div className="border-r-0 md:border-r border-[rgba(55,50,47,0.12)] p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6 bg-transparent">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                          Kubernetes & WordPress native
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          Helm chart with Go sidecar deploys in 60 seconds—zero code changes. WordPress plugin monitors wp-cron across hundreds of sites from one dashboard.
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden justify-center items-center relative bg-transparent">
                        <div className="w-full h-full flex items-center justify-center bg-transparent">
                          <EffortlessIntegration width={400} height={250} className="max-w-full max-h-full" />
                        </div>
                        {/* Gradient mask for soft bottom edge */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#F7F5F3] to-transparent pointer-events-none"></div>
                      </div>
                    </div>

                    {/* Bottom Right - Numbers that speak */}
                    <div className="p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-start items-start gap-4 sm:gap-6">
                      <div className="flex flex-col gap-2">
                        <h3 className="text-[#37322F] text-lg sm:text-xl font-semibold leading-tight font-sans">
                          Health scores & reliability metrics
                        </h3>
                        <p className="text-[#605A57] text-sm md:text-base font-normal leading-relaxed font-sans">
                          A-F health grades (0-100 score), MTBF/MTTR tracking, P50/P95/P99 percentiles, and uptime trends. Monitor SLOs with precision.
                        </p>
                      </div>
                      <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] rounded-lg flex overflow-hidden items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <NumbersThatSpeak
                            width="100%"
                            height="100%"
                            theme="light"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        {/* Gradient mask for soft bottom edge */}
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#F7F5F3] to-transparent pointer-events-none"></div>
                      </div>
                    </div>
                  </div>

                  <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                    {/* Right decorative pattern */}
                    <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                      {Array.from({ length: 200 }).map((_, i) => (
                        <div
                          key={i}
                          className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentation Section */}
              <DocumentationSection />

              {/* Testimonials Section */}
              <TestimonialsSection />

              {/* Pricing Section */}
              <PricingSection />

              {/* FAQ Section */}
              <FAQSection />

              {/* CTA Section */}
              <CTASection />

              {/* Footer Section */}
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  )
}
