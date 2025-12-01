import type { ReactNode } from 'react'

export type InfoVariant = 'contest' | 'howto'

const InfoCardContent = ({ variant }: { variant: InfoVariant }) => {
  if (variant === 'contest') {
    return (
      <>
        <p className="info-card__eyebrow">Contest Overview</p>
        <h1 className="info-card__title">TEE-DS 2026 T-Shirt Design Contest</h1>
        <p className="info-card__subtitle">Theme: Life-Centered Design &mdash; Design is a Dialogue</p>
        <div className="info-card__body">
          <p>
            Welcome to the inaugural year of TEE-DS: The Design School T-Shirt Contest, where creativity becomes
            conversation. This cross-disciplinary event invites students from Architecture, Industrial Design, Graphic
            Design, Interior Design, and Urban Design to submit wearable art inspired by this year&apos;s theme.
          </p>
          <p>
            The prompt asks designers to think beyond themselves and beyond the screen&mdash;to see design as an active
            dialogue with the world around us. Every decision should speak to people, places, and the planet with empathy,
            ecology, and exchange at the forefront.
          </p>
          <p>
            Participants will translate those ideas into a T-shirt that embodies connection, purpose, and play. Clever
            graphics, typography, and conceptual storytelling are all welcome; each shirt becomes part of an ongoing
            conversation about what design means&mdash;and who it&apos;s for.
          </p>
        </div>
        <div className="info-card__grid info-card__grid--contest">
          <section>
            <p className="info-card__label">Event Fee</p>
            <ul className="info-card__list">
              <li>Contest entry & design submissions are free</li>
              <li>$10 covers the optional screen-printing mini lesson + winning shirt</li>
              <li>That $10 splits evenly: $5 to our printing partner, $5 to Generous Devils Club</li>
            </ul>
          </section>
          <section>
            <p className="info-card__label">Why enter</p>
            <p>
              The winning design will be produced, sold, and worn across The Design School community&mdash;earning the
              creator the title of first-ever TEE-DS Champion.
            </p>
            <p className="info-card__tagline">
              TEE-DS 2026: Life-Centered Design &mdash; Design is a Dialogue.
            </p>
          </section>
        </div>
      </>
    )
  }

  return (
    <>
      <p className="info-card__eyebrow">How to Enter</p>
      <h1 className="info-card__title">Contest Checklist</h1>
      <div className="info-card__grid info-card__grid--columns">
        <section>
          <p className="info-card__label">Entry limits</p>
          <ul className="info-card__list">
            <li>&rarr; Max 2 entries per student</li>
            <li>&rarr; One per modality</li>
          </ul>
          <p>Online = 2, online entries only.</p>
          <p>In-person = 2, in-person entries only.</p>
          <p className="info-card__muted">No cross-modality entries.</p>
        </section>
        <section>
          <p className="info-card__label">Submission requirements</p>
          <ul className="info-card__list">
            <li>&rarr; Original work only</li>
            <li>&rarr; No AI-generated imagery</li>
            <li>&rarr; No offensive or explicit content</li>
            <li>&rarr; ASU-compliant</li>
          </ul>
          <p className="info-card__label info-card__label--inline">Format</p>
          <p>PDF / PNG</p>
        </section>
        <section>
          <p className="info-card__label">Deadline</p>
          <p>&rarr; January 16, 2026 by 11:59 PM</p>
          <p className="info-card__label info-card__label--inline">Cost</p>
          <div className="cost-highlight">
            <span className="cost-highlight__arrow" aria-hidden="true" />
            <p>FREE!!</p>
          </div>
          <p className="info-card__label info-card__label--inline">Website</p>
          <p>&rarr; Posted today via Instagram!!</p>
        </section>
      </div>
    </>
  )
}

interface InfoCardProps {
  variant: InfoVariant
  footer?: ReactNode
  withClose?: boolean
  onClose?: () => void
}

const InfoCard = ({ variant, footer, withClose = false, onClose }: InfoCardProps) => (
  <div className="info-card">
    {withClose && (
      <button className="ghost-button info-card__close" type="button" onClick={onClose}>
        Close
      </button>
    )}
    <InfoCardContent variant={variant} />
    <div className="info-card__dotted" aria-hidden="true" />
    {footer}
  </div>
)

export const IntroInfoStage = ({
  variant,
  actionLabel,
  onAdvance
}: {
  variant: InfoVariant
  actionLabel: string
  onAdvance: () => void
}) => (
  <div className="info-stage">
    <InfoCard
      variant={variant}
      footer={
        <div className="info-card__actions">
          <button className="glow-button" type="button" onClick={onAdvance}>
            {actionLabel}
          </button>
        </div>
      }
    />
  </div>
)

export const InfoModal = ({ variant, onClose }: { variant: InfoVariant; onClose: () => void }) => (
  <div className="info-overlay" role="dialog" aria-modal="true">
    <InfoCard variant={variant} withClose onClose={onClose} />
  </div>
)
