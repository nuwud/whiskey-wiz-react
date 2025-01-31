import { useState } from 'react';
import { accessibilityManager, AccessibilityPreferences, AccessibilityReport } from '../services/accessibility.service';

export const useAccessibility = () => {
  const [accessibilityPreferences, setAccessibilityPreferences] = useState<AccessibilityReport>(
    accessibilityManager.generateAccessibilityReport()
  );

  const updateAccessibilityPreferences = (updates: Partial<AccessibilityPreferences>) => {
    accessibilityManager.updatePreferences(updates);
    setAccessibilityPreferences(accessibilityManager.generateAccessibilityReport());
  };

  return {
    accessibilityPreferences,
    updateAccessibilityPreferences,
    runAccessibilityAudit: () => accessibilityManager.runAccessibilityAudit()
  };
};