import teeLogo from '../assets/logos/tee-ds.svg'
import thereSpaceLogo from '../assets/logos/therespacelogo.svg'
import generousDevilsLogo from '../assets/logos/generousdevils.svg'
import ramSystemLogo from '../assets/logos/ramsystem.svg'
import asuTdsLogo from '../assets/logos/asutds.png'
import type { InfoVariant } from './InfoPages'

interface SiteFooterProps {
  onOpen: (variant: InfoVariant) => void
  onContact: () => void
}

const SiteFooter = ({ onOpen, onContact }: SiteFooterProps) => (
  <footer className="site-footer">
    <div className="site-footer__brand">
      <img src={teeLogo} alt="TEE-DS 2026 logo" className="site-footer__mark" />
      <div>
        <p className="site-footer__title">TEE-DS 2026 T-Shirt Design Contest</p>
        <p className="site-footer__caption">&copy; The Design School at ASU 2026</p>
        <div className="site-footer__actions">
          <button className="ghost-button" type="button" onClick={() => onOpen('contest')}>
            Contest overview
          </button>
          <button className="ghost-button" type="button" onClick={() => onOpen('howto')}>
            How to enter
          </button>
          <button className="ghost-button" type="button" onClick={onContact}>
            Contact organizers
          </button>
        </div>
      </div>
    </div>
    <div className="site-footer__divider" aria-hidden="true" />
    <div className="site-footer__powered">
      <p className="site-footer__powered-label">Powered by</p>
      <div className="site-footer__logos">
        <div className="site-footer__logo-card site-footer__logo-card--image">
          <img src={asuTdsLogo} alt="The Design School at ASU logo" loading="lazy" />
          <span className="site-footer__logo-tooltip" role="tooltip">
            Arizona State University
          </span>
        </div>
        <div className="site-footer__logo-card site-footer__logo-card--image">
          <img src={generousDevilsLogo} alt="Generous Devils logo" loading="lazy" />
          <span className="site-footer__logo-tooltip" role="tooltip">
            Materials program @ ASU
          </span>
        </div>
        <div className="site-footer__logo-card site-footer__logo-card--image">
          <img src={thereSpaceLogo} alt="There Space logo" loading="lazy" />
          <span className="site-footer__logo-tooltip" role="tooltip">
            Arizona&apos;s only membership-based screen print studio.
          </span>
        </div>
        <div className="site-footer__logo-card site-footer__logo-card--image site-footer__logo-card--ram">
          <img src={ramSystemLogo} alt="RAM system logo" loading="lazy" />
          <span className="site-footer__logo-tooltip" role="tooltip">
            Recycle · Allocate · Maintain
          </span>
        </div>
      </div>
    </div>
  </footer>
)

export default SiteFooter
