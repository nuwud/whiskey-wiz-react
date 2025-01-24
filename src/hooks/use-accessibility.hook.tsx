import { useState, useEffect } from 'react';
import { AccessibilityManager } from 'src/services/accessibility.service';

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