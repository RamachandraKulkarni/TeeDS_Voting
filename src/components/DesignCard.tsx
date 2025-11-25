type DesignCardProps = {
  title: string
  imageUrl: string
  meta?: string
  actionLabel?: string
  onAction?: () => void
  disabled?: boolean
  footer?: React.ReactNode
}

const DesignCard = ({ title, imageUrl, meta, actionLabel, onAction, disabled, footer }: DesignCardProps) => (
  <article className="design-card fade-in">
    <div className="design-media">
      <img src={imageUrl} alt={title} loading="lazy" />
    </div>
    <div className="design-meta">
      <span>{meta ?? 'Design drop'}</span>
      {footer}
    </div>
    <h3 style={{ margin: 0 }}>{title}</h3>
    {actionLabel && (
      <button className="pill-button" onClick={onAction} disabled={disabled} type="button">
        {actionLabel}
      </button>
    )}
  </article>
)

export default DesignCard
