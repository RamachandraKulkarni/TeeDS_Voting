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
  <article className="card" style={{ padding: '1rem' }}>
    <div style={{ width: '100%', aspectRatio: '4 / 5', overflow: 'hidden', borderRadius: '0.75rem', marginBottom: '0.75rem' }}>
      <img
        src={imageUrl}
        alt={title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
    <h3 style={{ margin: '0 0 0.25rem 0' }}>{title}</h3>
    {meta && (
      <small style={{ display: 'block', marginBottom: '0.75rem', color: '#6366f1' }}>{meta}</small>
    )}
    {actionLabel && (
      <button onClick={onAction} disabled={disabled} type="button" style={{ width: '100%' }}>
        {actionLabel}
      </button>
    )}
    {footer}
  </article>
)

export default DesignCard
