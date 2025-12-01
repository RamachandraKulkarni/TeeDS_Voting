import { MouseEvent, useCallback, useId, useState } from 'react'

export type AnimatedDeleteButtonProps = {
  label?: string
  onDelete?: () => void
  disabled?: boolean
  ariaLabel?: string
}

const LETTERS = ['D', 'e', 'l', 'e', 't', 'e']

const AnimatedDeleteButton = ({ label = 'Delete', onDelete, disabled, ariaLabel }: AnimatedDeleteButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const clipPathId = useId()
  const polylineId = useId()

  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    if (disabled || isAnimating) return
    setIsAnimating(true)
    onDelete?.()
  }, [disabled, isAnimating, onDelete])

  const handleAnimationEnd = useCallback(() => {
    setIsAnimating(false)
  }, [])

  return (
    <button
      type="button"
      className="del-btn"
      aria-label={ariaLabel ?? label}
      onClick={handleClick}
      data-running={isAnimating ? 'true' : 'false'}
      disabled={disabled || isAnimating}
    >
      <svg className="del-btn__icon" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true">
        <clipPath id={clipPathId}>
          <rect className="del-btn__icon-can-fill" x="5" y="24" width="14" height="11" />
        </clipPath>
        <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" transform="translate(12,12)">
          <g className="del-btn__icon-lid">
            <polyline points="9,5 9,1 15,1 15,5" />
            <polyline points="4,5 20,5" />
          </g>
          <g className="del-btn__icon-can">
            <g strokeWidth="0">
              <polyline id={polylineId} points="6,10 7,23 17,23 18,10" />
              <use clipPath={`url(#${clipPathId})`} href={`#${polylineId}`} xlinkHref={`#${polylineId}`} fill="#fff" />
            </g>
            <polyline points="6,10 7,23 17,23 18,10" />
          </g>
        </g>
      </svg>
      <span className="del-btn__letters" aria-hidden="true" data-anim onAnimationEnd={handleAnimationEnd}>
        {LETTERS.map((letter, index) => (
          <span key={`${letter}-${index}`} className="del-btn__letter-box">
            <span className="del-btn__letter">{letter}</span>
          </span>
        ))}
      </span>
      <span className="sr-only">{label}</span>
    </button>
  )
}

export default AnimatedDeleteButton
