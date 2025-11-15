import React, { useState } from 'react';

interface SettingsPanelProps {
  onClose?: () => void;
}

/**
 * Settings Panel - Accessibility settings
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const handleHighContrastToggle = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    
    // Apply high contrast mode to document
    if (newValue) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const handleFontSizeChange = (size: 'normal' | 'large' | 'xlarge') => {
    setFontSize(size);
    
    // Apply font size to document
    document.body.classList.remove('font-normal', 'font-large', 'font-xlarge');
    document.body.classList.add(`font-${size}`);
  };

  return (
    <div className="settings-panel" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Accessibility Settings</h2>
        {onClose && (
          <button style={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        )}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionHeading}>Display</h3>
        
        <div style={styles.setting}>
          <label style={styles.label}>
            <input
              type="checkbox"
              checked={highContrast}
              onChange={handleHighContrastToggle}
              style={styles.checkbox}
            />
            High Contrast Mode
          </label>
          <p style={styles.description}>
            Increases contrast for better visibility
          </p>
        </div>

        <div style={styles.setting}>
          <label style={styles.label}>Font Size</label>
          <div style={styles.buttonGroup}>
            <button
              style={{
                ...styles.sizeButton,
                backgroundColor: fontSize === 'normal' ? '#2196F3' : '#f0f0f0',
                color: fontSize === 'normal' ? 'white' : '#333',
              }}
              onClick={() => handleFontSizeChange('normal')}
            >
              Normal
            </button>
            <button
              style={{
                ...styles.sizeButton,
                backgroundColor: fontSize === 'large' ? '#2196F3' : '#f0f0f0',
                color: fontSize === 'large' ? 'white' : '#333',
              }}
              onClick={() => handleFontSizeChange('large')}
            >
              Large
            </button>
            <button
              style={{
                ...styles.sizeButton,
                backgroundColor: fontSize === 'xlarge' ? '#2196F3' : '#f0f0f0',
                color: fontSize === 'xlarge' ? 'white' : '#333',
              }}
              onClick={() => handleFontSizeChange('xlarge')}
            >
              Extra Large
            </button>
          </div>
        </div>
      </div>

      <div style={styles.info}>
        <p style={styles.infoText}>
          💡 These settings will be saved for your next session
        </p>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    maxWidth: '500px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  heading: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionHeading: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '15px',
    color: '#555',
  },
  setting: {
    marginBottom: '20px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '5px',
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: '10px',
    cursor: 'pointer',
    width: '18px',
    height: '18px',
  },
  description: {
    fontSize: '12px',
    color: '#666',
    marginLeft: '28px',
    marginTop: '5px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  sizeButton: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  info: {
    backgroundColor: '#f0f7ff',
    padding: '15px',
    borderRadius: '4px',
    borderLeft: '4px solid #2196F3',
  },
  infoText: {
    margin: 0,
    fontSize: '13px',
    color: '#555',
  },
};

export default SettingsPanel;
