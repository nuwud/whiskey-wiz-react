import { useState, useEffect } from 'react';
import { AccessibilityManager } from '../utils/AccessibilityManager';

export const useAccessibility = () => {
  const accessibilityManager = AccessibilityManager.getInstance();
  const [accessibilityPreferences, setAccessibilityPreferences] = useState(
    accessibilityManager.generateAccessibilityReport()
  );

  const updateAccessibilityPreferences = (updates: any) => {
    accessibilityManager.updatePreferences(updates);
    setAccessibilityPreferences(accessibilityManager.generateAccessibilityReport());
  };

  return {
    accessibilityPreferences,
    updateAccessibilityPreferences,
    runAccessibilityAudit: () => accessibilityManager.runAccessibilityAudit()
  };
};