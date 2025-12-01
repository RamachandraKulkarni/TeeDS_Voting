import ArrowIcon from './ArrowIcon'
import AnimatedDeleteButton from './AnimatedDeleteButton'

type DesignCardProps = {
  title: string
  imageUrl: string
  meta?: string
  actionLabel?: string
  onAction?: () => void
  disabled?: boolean
  footer?: React.ReactNode
  onPreview?: () => void
  actionTone?: 'default' | 'delete'
}

const DesignCard = ({
  title,
  imageUrl,
  meta,
  actionLabel,
  onAction,
  disabled,
  footer,
  onPreview,
  actionTone = 'default',
}: DesignCardProps) => (
  <article
    className="design-card fade-in"
    onClick={onPreview}
    role={onPreview ? 'button' : undefined}
    tabIndex={onPreview ? 0 : undefined}
    onKeyDown={(event) => {
      if (!onPreview) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onPreview()
      }
    }}
  >
    <div className="design-media">
      <img src={imageUrl} alt={title} loading="lazy" />
    </div>
    {(meta || footer) && (
      <div className="design-meta">
        {meta && <span>{meta}</span>}
        {footer}
      </div>
    )}
    <h3 style={{ margin: 0 }}>{title}</h3>
    {actionLabel && actionTone === 'default' && (
      <button
        className="pill-button"
        onClick={(event) => {
          event.stopPropagation()
          onAction?.()
        }}
        disabled={disabled}
        type="button"
      >
        <span className="pill-button__knob">
          <ArrowIcon />
        </span>
        <span className="pill-button__label">{actionLabel}</span>
      </button>
    )}
    {actionLabel && actionTone === 'delete' && (
      <AnimatedDeleteButton
        label={actionLabel}
        disabled={disabled}
        onDelete={() => {
          onAction?.()
        }}
      />
    )}
  </article>
)

export default DesignCard
