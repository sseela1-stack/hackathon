/**
 * Flow Beacons - Pulsing overlays that highlight UI elements
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BeaconConfig } from '../../flow/flowTypes';
import styles from './FlowBeacons.module.css';

interface FlowBeaconsProps {
  beacon: BeaconConfig | null;
  onDismiss?: () => void;
}

export function FlowBeacons({ beacon, onDismiss }: FlowBeaconsProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!beacon) {
      setTargetRect(null);
      return;
    }

    const updateRect = () => {
      const element = document.querySelector(beacon.targetSelector);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    // Initial position
    updateRect();

    // Update on scroll/resize
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [beacon]);

  if (!beacon || !targetRect) {
    return null;
  }

  const { position = 'bottom' } = beacon;

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  const padding = 16;

  switch (position) {
    case 'top':
      tooltipStyle = {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.top - padding,
        transform: 'translate(-50%, -100%)',
      };
      break;
    case 'bottom':
      tooltipStyle = {
        left: targetRect.left + targetRect.width / 2,
        top: targetRect.bottom + padding,
        transform: 'translate(-50%, 0)',
      };
      break;
    case 'left':
      tooltipStyle = {
        left: targetRect.left - padding,
        top: targetRect.top + targetRect.height / 2,
        transform: 'translate(-100%, -50%)',
      };
      break;
    case 'right':
      tooltipStyle = {
        left: targetRect.right + padding,
        top: targetRect.top + targetRect.height / 2,
        transform: 'translate(0, -50%)',
      };
      break;
  }

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-live="polite">
      {/* Pulsing ring around target */}
      <div
        className={styles.ring}
        style={{
          left: targetRect.left - 8,
          top: targetRect.top - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
        }}
        aria-hidden="true"
      />

      {/* Tooltip with text */}
      <div className={styles.tooltip} style={tooltipStyle}>
        <div className={styles.tooltipContent}>
          {beacon.text}
        </div>
        {onDismiss && (
          <button
            className={styles.dismissButton}
            onClick={onDismiss}
            aria-label="Dismiss hint"
          >
            Got it!
          </button>
        )}
        {/* Arrow pointer */}
        <div className={`${styles.arrow} ${styles[`arrow-${position}`]}`} aria-hidden="true" />
      </div>
    </div>,
    document.body
  );
}
