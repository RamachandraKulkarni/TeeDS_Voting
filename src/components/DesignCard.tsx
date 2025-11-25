import ArrowIcon from './ArrowIcon'

type DesignCardProps = {
  title: string
  imageUrl: string
  meta?: string
  actionLabel?: string
  onAction?: () => void
  disabled?: boolean
  footer?: React.ReactNode
  onPreview?: () => void
}

const DesignCard = ({ title, imageUrl, meta, actionLabel, onAction, disabled, footer, onPreview }: DesignCardProps) => (
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
    <div className="design-meta">
      <span>{meta ?? 'Design drop'}</span>
      {footer}
    </div>
    <h3 style={{ margin: 0 }}>{title}</h3>
    {actionLabel && (
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
  </article>
)

export default DesignCard
