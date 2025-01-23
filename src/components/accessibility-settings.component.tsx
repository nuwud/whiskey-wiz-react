import React from 'react';
import { useAccessibility } from '../hooks/use-accessibility.hook';

export const AccessibilitySettings: React.FC = () => {
  const { 
    accessibilityPreferences, 
    updateAccessibilityPreferences 
  } = useAccessibility();

  return (
    <div className="accessibility-settings">
      <h2>Accessibility Preferences</h2>
      
      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={accessibilityPreferences.preferences.highContrastMode}
            onChange={(e) => updateAccessibilityPreferences({
              highContrastMode: e.target.checked
            })}
          />
          High Contrast Mode
        </label>
      </div>

      <div className="setting">
        <label>Font Size</label>
        <select title="Font Size"
          value={accessibilityPreferences.preferences.fontSize}
          onChange={(e) => updateAccessibilityPreferences({
            fontSize: e.target.value
          })}
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={accessibilityPreferences.preferences.screenReaderMode}
            onChange={(e) => updateAccessibilityPreferences({
              screenReaderMode: e.target.checked
            })}
          />
          Screen Reader Mode
        </label>
      </div>

      <div className="setting">
        <label>
          <input
            type="checkbox"
            checked={accessibilityPreferences.preferences.reducedMotion}
            onChange={(e) => updateAccessibilityPreferences({
              reducedMotion: e.target.checked
            })}
          />
          Reduced Motion
        </label>
      </div>
    </div>
  );
};