import React from 'react';
import '../styles/CrisisBanner.css';

interface CrisisBannerProps {
  crisisType: 'jobLoss' | 'bigUnexpectedBill' | 'rentHike';
  onDismiss: () => void;
}

/**
 * Crisis Coach Banner - Non-modal callout with actionable steps
 * Displays when player encounters a crisis scenario and needs guidance
 */
const CrisisBanner: React.FC<CrisisBannerProps> = ({ crisisType, onDismiss }) => {
  const crisisContent = getCrisisContent(crisisType);

  return (
    <div className="crisis-banner" role="alert" aria-live="polite">
      <div className="crisis-banner__header">
        <div className="crisis-banner__icon">🆘</div>
        <h3 className="crisis-banner__title">Crisis Coach</h3>
      </div>
      
      <p className="crisis-banner__message">{crisisContent.message}</p>
      
      <div className="crisis-banner__steps">
        <h4 className="crisis-banner__steps-title">What to do right now:</h4>
        <ol className="crisis-banner__list">
          {crisisContent.steps.map((step, index) => (
            <li key={index} className="crisis-banner__step">
              <span className="crisis-banner__step-number">{index + 1}</span>
              <span className="crisis-banner__step-text">{step}</span>
            </li>
          ))}
        </ol>
      </div>
      
      <button 
        className="crisis-banner__dismiss"
        onClick={onDismiss}
        aria-label="Dismiss crisis coach banner"
      >
        Got it
      </button>
    </div>
  );
};

/**
 * Get crisis-specific content with actionable steps
 */
function getCrisisContent(crisisType: 'jobLoss' | 'bigUnexpectedBill' | 'rentHike') {
  switch (crisisType) {
    case 'jobLoss':
      return {
        message: "Job loss is tough, but you can get through this. Here's your immediate action plan:",
        steps: [
          "File for unemployment benefits TODAY - don't wait",
          "List ALL monthly expenses and mark what you can pause (subscriptions, memberships)",
          "Contact creditors about hardship programs BEFORE missing payments"
        ]
      };
    
    case 'bigUnexpectedBill':
      return {
        message: "Big unexpected bills are stressful. Let's handle this strategically:",
        steps: [
          "Check if you can negotiate a payment plan - many providers offer this",
          "Use your emergency fund if you have one - this is what it's for",
          "Avoid high-interest credit cards if possible - explore lower-rate options first"
        ]
      };
    
    case 'rentHike':
      return {
        message: "Rent increases happen, but you have options. Here's what to consider:",
        steps: [
          "Calculate your new housing-to-income ratio (should stay under 30%)",
          "Compare: Is moving worth the cost? Check security deposit + moving expenses",
          "If staying, identify where to cut $150-250/month from your budget"
        ]
      };
  }
}

export default CrisisBanner;
