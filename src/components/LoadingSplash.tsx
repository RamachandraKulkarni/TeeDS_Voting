import { useEffect, useRef } from 'react'
import anime from 'animejs'

interface LoadingSplashProps {
  onFinish: () => void
}

const LoadingSplash = ({ onFinish }: LoadingSplashProps) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const strokeTargets = svgRef.current?.querySelectorAll('[data-stroke]') ?? []
    const tl = anime.timeline({ easing: 'easeOutQuad' })

    tl.add({
      targets: strokeTargets,
      strokeDashoffset: [anime.setDashoffset, 0],
      duration: 1200,
      delay: anime.stagger(150)
    })
      .add(
        {
          targets: svgRef.current,
          opacity: [0, 1],
          scale: [0.9, 1],
          duration: 600
        },
        '-=600'
      )
      .add(
        {
          targets: dotsRef.current,
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 600
        },
        '-=300'
      )
      .add({
        targets: taglineRef.current,
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 500
      })
      .add({
        targets: progressRef.current,
        width: ['0%', '100%'],
        duration: 800,
        easing: 'easeInOutSine'
      })
      .add({
        targets: '.loading-splash',
        opacity: [1, 0],
        duration: 450,
        easing: 'easeInOutQuad',
        complete: onFinish
      })

    return () => {
      tl.pause()
    }
  }, [onFinish])

  return (
    <div className="loading-splash" role="status" aria-live="polite">
      <div className="loading-splash__content">
        <div className="loading-splash__logo" aria-hidden="true">
          <svg
            ref={svgRef}
            width="210"
            height="160"
            viewBox="0 0 210 160"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              data-stroke
              d="M34 36.5C62 21 88.5 12 108.5 12C128.5 12 157 21 176 34"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              data-stroke
              d="M25 63.5C30 50.5 46.5 37.5 61 37.5H152.5C166 37.5 182.5 50.5 187.5 63.5L200 98.5C206 115.5 195.5 136 177 141.5L113.5 160C104 162.5 92.5 162.5 83 160L29.5 145C14.5 141 3.5 124.5 9 108.5L25 63.5Z"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              data-stroke
              d="M61 39C72.5 57.5 93.5 70 108 70C122.5 70 144.5 57.5 155.5 39"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="dotShade" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#111827" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#111827" stopOpacity="0" />
              </linearGradient>
            </defs>
            <ellipse cx="104" cy="116" rx="72" ry="30" fill="url(#dotShade)" opacity="0.35" />
          </svg>
        </div>
        <div ref={dotsRef} className="loading-splash__meta">
          <span>TEE-DS</span>
          <span>2026</span>
        </div>
        <p ref={taglineRef} className="loading-splash__tagline">
          TEE-DS 2026 - Wear your discipline. Design for life.
        </p>
        <div className="loading-splash__progress-track" aria-hidden="true">
          <div ref={progressRef} className="loading-splash__progress" />
        </div>
      </div>
    </div>
  )
}

export default LoadingSplash
