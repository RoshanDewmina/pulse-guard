"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { FeatureCards } from "./feature-cards"

const heroImages = [
  {
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dsadsadsa.jpg-xTHS4hGwCWp2H5bTj8np6DXZUyrxX7.jpeg",
    alt: "Saturn Cron Monitoring Dashboard - Real-time health scores, status overview, and performance metrics for scheduled jobs with anomaly detection",
  },
  {
    src: "/analytics-dashboard-with-charts-graphs-and-data-vi.jpg",
    alt: "Saturn Analytics Dashboard - MTBF, MTTR, and anomaly trends with statistical analysis charts for cron job monitoring and reliability metrics",
  },
  {
    src: "/data-visualization-dashboard-with-interactive-char.jpg",
    alt: "Saturn Runtime Trends - Duration analysis and performance insights with time-series data visualization for cron job monitoring",
  },
]

const features = [
  {
    title: "Anomaly detection",
    description: "Z-Score analysis establishes baselines and detects when jobs slow down—even if they succeed.",
  },
  {
    title: "Health scores & MTTR/MTBF",
    description: "Track reliability with A-F health grades, mean time metrics, and P50/P95/P99 percentiles.",
  },
  {
    title: "Zero-code integrations",
    description: "Kubernetes Helm chart deploys in 60 seconds. WordPress plugin for bulk wp-cron management.",
  },
]

export function InteractiveHero() {
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3)
          }
          return 0
        }
        return prev + 2 // 2% every 100ms = 5 seconds total
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  return (
    <>
      {/* Hero Carousel */}
      <div className="w-full max-w-[960px] lg:w-[960px] pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 px-2 sm:px-4 md:px-6 lg:px-11 flex flex-col justify-center items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0">
        <div className="w-full max-w-[960px] lg:w-[960px] h-[200px] sm:h-[280px] md:h-[450px] lg:h-[695.55px] bg-white shadow-[0px_0px_0px_0.9056603908538818px_rgba(0,0,0,0.08)] overflow-hidden rounded-[6px] sm:rounded-[8px] lg:rounded-[9.06px] flex flex-col justify-start items-start" style={{ aspectRatio: '960/696' }}>
          <div className="self-stretch flex-1 flex justify-start items-start">
            <div className="w-full h-full flex items-center justify-center">
              <div className="relative w-full h-full overflow-hidden">
                {heroImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                      activeCard === index ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-95 blur-sm"
                    }`}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      fill
                      priority={index === 0}
                      loading={index === 0 ? undefined : "lazy"}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 960px, 960px"
                      quality={85}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div id="features" className="self-stretch border-t border-[#E0DEDB] border-b border-[#E0DEDB] flex justify-center items-start scroll-mt-20">
        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              ></div>
            ))}
          </div>
        </div>

        <div className="flex-1 px-0 sm:px-2 md:px-0 flex flex-col md:flex-row justify-center items-stretch gap-0">
          <FeatureCards
            features={features}
            activeCard={activeCard}
            progress={progress}
            onCardClick={handleCardClick}
          />
        </div>

        <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
          <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export { InteractiveHero as default }

