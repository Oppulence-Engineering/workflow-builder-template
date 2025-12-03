"use client";

import type { ReactNode } from "react";
import { useWizard } from "./wizard-container";

/**
 * Props for the WizardStep component.
 *
 * WizardStep acts as a conditional renderer that only displays its children
 * when the stepId matches the currently active step in the wizard.
 */
type WizardStepProps = {
  /**
   * Unique identifier for this step.
   * Must match one of the step IDs in the steps array passed to WizardContainer.
   */
  stepId: string;
  /** Content to render when this step is active. */
  children: ReactNode;
};

export function WizardStep({ stepId, children }: WizardStepProps) {
  const { currentStep } = useWizard();

  // Only render if this is the current step
  if (currentStep?.id !== stepId) {
    return null;
  }

  return <div className="space-y-4">{children}</div>;
}
