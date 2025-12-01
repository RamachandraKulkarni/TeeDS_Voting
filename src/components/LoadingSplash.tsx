import { useEffect, useRef } from 'react'
import anime from 'animejs'
import teeLogo from '../assets/logos/tee-ds.svg'

interface LoadingSplashProps {
  onFinish: () => void
}

const LoadingSplash = ({ onFinish }: LoadingSplashProps) => {
  const logoRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement>(null)
  const taglineRef = useRef<HTMLParagraphElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const tl = anime.timeline({ easing: 'easeOutQuad' })

    tl.add({
      targets: logoRef.current,
      opacity: [0, 1],
      scale: [0.85, 1],
      duration: 900
    })
      .add(
        {
          targets: dotsRef.current,
          opacity: [0, 1],
          translateY: [16, 0],
          duration: 600
        },
        '-=400'
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
        <div ref={logoRef} className="loading-splash__logo" aria-hidden="true">
          <img src={teeLogo} alt="TEE-DS 2026 logo" />
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
