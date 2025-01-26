import { useState } from 'react';
import { accessibilityManager } from 'src/components/accessibility-settings.component';

export const useAccessibility = () => {
  const accessibilityManager = accessibilityManager.getInstance();
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