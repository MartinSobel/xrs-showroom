'use client';

/**
 * Tiny "?" icon with a CSS-only tooltip on hover.
 */
export default function HelpTooltip({ text }) {
  return (
    <span className="help-tooltip">
      <span className="help-icon">?</span>
      <span className="help-bubble">{text}</span>
    </span>
  );
}
