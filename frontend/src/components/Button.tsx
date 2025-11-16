import React from 'react';
import '../styles/Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * Button component with mobile-first touch targets and accessibility
 * - iOS: min-height 44px
 * - Android: min-height 48px
 * - WCAG AA focus styles
 * - Safe edge padding for gesture navigation
 */
export function Button({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
