import teeLogo from '../assets/logos/tee-ds.svg'
import type { InfoVariant } from './InfoPages'

interface SiteFooterProps {
  onOpen: (variant: InfoVariant) => void
}

const SiteFooter = ({ onOpen }: SiteFooterProps) => (
  <footer className="site-footer">
    <div className="site-footer__brand">
      <img src={teeLogo} alt="TEE-DS 2026 logo" className="site-footer__mark" />
      <div>
        <p className="site-footer__title">TEE-DS 2026 T-Shirt Design Contest</p>
        <p className="site-footer__caption">&copy; The Design School at ASU 2025</p>
        <div className="site-footer__actions">
          <button className="ghost-button" type="button" onClick={() => onOpen('contest')}>
            Contest overview
          </button>
          <button className="ghost-button" type="button" onClick={() => onOpen('howto')}>
            How to enter
          </button>
        </div>
      </div>
    </div>
    <div className="site-footer__divider" aria-hidden="true" />
    <div className="site-footer__powered">
      <p className="site-footer__powered-label">Powered by</p>
      <div className="site-footer__logos">
        <div className="site-footer__logo-card" aria-label="Collaborator logo placeholder">
          Collaborator logo coming soon
        </div>
        <div className="site-footer__logo-card" aria-label="Partner logo placeholder">
          Partner logo coming soon
        </div>
      </div>
    </div>
  </footer>
)

export default SiteFooter
