// WCAG Contrast Ratio Verification
// This script verifies all color combinations meet WCAG AA standards (≥4.5:1 for normal text)

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function checkContrast(foreground, background, label) {
  const ratio = getContrastRatio(foreground, background);
  const passes = ratio >= 4.5;
  const status = passes ? '✓ PASS' : '✗ FAIL';
  console.log(`${status} ${label}: ${ratio.toFixed(2)}:1 (${foreground} on ${background})`);
  return passes;
}

console.log('=== WCAG AA Contrast Ratio Verification ===\n');
console.log('Standard: ≥4.5:1 for normal text, ≥3:1 for large text\n');

const colors = {
  surface: '#ffffef',
  onSurface: '#1c1b1e',
  onSurfaceVariant: '#49454e',
  primary: '#8b6914',
  onPrimary: '#ffffff',
  primaryContainer: '#ffedb3',
  onPrimaryContainer: '#2d1f00',
  secondary: '#6b5e3f',
  onSecondary: '#ffffff',
  secondaryContainer: '#f4e7c3',
  onSecondaryContainer: '#231b04',
  surfaceVariant: '#e7e0ec',
  outline: '#79747e',
  outlineVariant: '#cac4cf'
};

let allPassed = true;

console.log('--- Surface Colors ---');
allPassed &= checkContrast(colors.onSurface, colors.surface, 'Body text on surface');
allPassed &= checkContrast(colors.onSurfaceVariant, colors.surface, 'Subtitle on surface');

console.log('\n--- Primary Colors ---');
allPassed &= checkContrast(colors.onPrimary, colors.primary, 'Primary button text');
allPassed &= checkContrast(colors.onPrimaryContainer, colors.primaryContainer, 'Primary container text');

console.log('\n--- Secondary Colors ---');
allPassed &= checkContrast(colors.onSecondary, colors.secondary, 'Secondary button text');
allPassed &= checkContrast(colors.onSecondaryContainer, colors.secondaryContainer, 'Secondary container text');

console.log('\n--- Input Elements ---');
allPassed &= checkContrast(colors.onSurface, colors.surfaceVariant, 'Input text on background');

console.log('\n--- Focus States ---');
allPassed &= checkContrast(colors.primary, '#ffffff', 'Primary border on white');

console.log('\n--- Overall Result ---');
if (allPassed) {
  console.log('✓ All color combinations pass WCAG AA standards!');
} else {
  console.log('✗ Some color combinations fail WCAG AA standards.');
  process.exit(1);
}
