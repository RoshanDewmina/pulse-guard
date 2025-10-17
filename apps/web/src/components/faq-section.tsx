"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
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
      "Use our Helm chart: helm repo add saturn https://charts.saturn.example.com && helm install your-monitor saturn/saturn-monitor --set saturn.token=YOUR_TOKEN. The Go sidecar automatically reports job status with zero code changes. Deployment takes under 60 seconds.",
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
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#49423D] font-semibold leading-tight md:leading-[44px] font-sans text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#605A57] text-base font-normal leading-7 font-sans">
            Common questions about anomaly detection,
            <br className="hidden md:block" />
            integrations, and how Saturn works.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(73,66,61,0.16)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(73,66,61,0.02)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#49423D] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[rgba(73,66,61,0.60)] transition-transform duration-300 ease-in-out ${
                          isOpen ? "rotate-180" : "rotate-0"
                        }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-[18px] text-[#605A57] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
