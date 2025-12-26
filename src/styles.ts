// Common styles shared across pages
export const commonStyles = `
  /* Material Design 3 - Color System (WCAG AA Compliant) */
  :root {
    /* Brand color #ffffef used as surface */
    --md-sys-color-surface: #ffffef;
    --md-sys-color-on-surface: #1c1b1e;
    --md-sys-color-on-surface-variant: #49454e;

    /* Primary colors - warm golden brown palette */
    --md-sys-color-primary: #8b6914;
    --md-sys-color-on-primary: #ffffff;
    --md-sys-color-primary-container: #ffedb3;
    --md-sys-color-on-primary-container: #2d1f00;

    /* Secondary colors - warm earth tones */
    --md-sys-color-secondary: #6b5e3f;
    --md-sys-color-on-secondary: #ffffff;
    --md-sys-color-secondary-container: #f4e7c3;
    --md-sys-color-on-secondary-container: #231b04;

    /* Neutral colors */
    --md-sys-color-surface-variant: #e7e0ec;
    --md-sys-color-outline: #79747e;
    --md-sys-color-outline-variant: #cac4cf;

    /* Error colors */
    --md-sys-color-error: #ba1a1a;
    --md-sys-color-on-error: #ffffff;
    --md-sys-color-error-container: #ffdad6;
  }

  /* Material Design - Base Styles */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--md-sys-color-surface);
    min-height: 100vh;
    padding: 20px;
    color: var(--md-sys-color-on-surface);
  }
  .container { max-width: 1200px; margin: 0 auto; }
  header { text-align: center; color: var(--md-sys-color-on-surface); margin-bottom: 40px; }
  h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    font-weight: 400;
    letter-spacing: -0.5px;
  }
  .subtitle {
    font-size: 1.1rem;
    color: var(--md-sys-color-on-surface-variant);
    font-weight: 300;
  }
  /* Skip link for keyboard navigation */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 0 0 4px 0;
    font-weight: 500;
    z-index: 100;
  }
  .skip-link:focus {
    top: 0;
  }
  /* Status messages for screen readers */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  /* Navigation */
  .nav-links {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-top: 15px;
  }
  .nav-links a {
    color: var(--md-sys-color-primary);
    text-decoration: none;
    font-weight: 500;
    padding: 8px 16px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  .nav-links a:hover {
    background: var(--md-sys-color-primary-container);
  }
  .nav-links a.active {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  @media (max-width: 768px) {
    h1 { font-size: 2rem; }
    .nav-links { flex-direction: column; align-items: center; }
  }
`;
