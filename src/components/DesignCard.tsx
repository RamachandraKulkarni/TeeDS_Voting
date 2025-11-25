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
  actionTone?: 'default' | 'delete'
}

const DeleteIcon = () => (
  <svg viewBox="0 0 448 512" aria-hidden width="100%" height="100%">
    <path
      fill="currentColor"
      d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64s14.3 32 32 32h384c17.7 0 32-14.3 32-32S433.7 32 416 32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32l21.2 339c1.6 25.3 22.6 45 47.9 45h198.8c25.3 0 46.3-19.7 47.9-45L416 128z"
    />
  </svg>
)

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
    <div className="design-meta">
      <span>{meta ?? 'Design drop'}</span>
      {footer}
    </div>
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
      <button
        className="delete-button"
        onClick={(event) => {
          event.stopPropagation()
          onAction?.()
        }}
        disabled={disabled}
        type="button"
      >
        <span className="delete-button__label">{actionLabel}</span>
        <span className="delete-button__icon">
          <DeleteIcon />
        </span>
      </button>
    )}
  </article>
)

export default DesignCard
