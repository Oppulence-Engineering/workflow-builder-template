"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

/**
 * Represents a single step in the wizard flow.
 *
 * Each step must have a unique ID that matches the stepId used in WizardStepContent.
 * The isValid flag controls whether the user can proceed to the next step.
 */
export type WizardStep = {
  /** Unique identifier for the step. Must match the stepId in WizardStepContent. */
  id: string;
  /** Display title shown in the progress indicator. */
  title: string;
  /** Optional description shown below the title in the progress indicator. */
  description?: string;
  /**
   * Whether this step is valid and allows progression to the next step.
   * Defaults to false if not provided. Steps should call updateStepValidity
   * to update this value based on their validation logic.
   */
  isValid?: boolean;
};

/**
 * Context type for wizard state and navigation functions.
 *
 * This type defines the shape of the wizard context that is provided to all
 * child components via the WizardContext.Provider.
 */
type WizardContextType = {
  /** Zero-based index of the currently active step. */
  currentStepIndex: number;
  /** Array of all wizard steps with their current validation state. */
  steps: WizardStep[];
  /**
   * Navigate to a specific step by index.
   * Only allows navigation to steps that have been completed (index < currentStepIndex).
   */
  goToStep: (index: number) => void;
  /**
   * Navigate to the next step if the current step is valid.
   * On the last step, calls the onComplete callback if provided.
   */
  goNext: () => void;
  /** Navigate to the previous step if not on the first step. */
  goBack: () => void;
  /** Whether the current step is the first step in the wizard. */
  isFirstStep: boolean;
  /** Whether the current step is the last step in the wizard. */
  isLastStep: boolean;
  /** The currently active step object, or undefined if no step is active. */
  currentStep: WizardStep | undefined;
  /**
   * Update the validation state of a step by its ID.
   * This should be called by step components when their validation state changes.
   */
  updateStepValidity: (stepId: string, isValid: boolean) => void;
  /**
   * Whether the user can proceed to the next step.
   * This is true when the current step's isValid property is true.
   */
  canProceed: boolean;
};

const WizardContext = createContext<WizardContextType | null>(null);

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardContainer");
  }
  return context;
}

/**
 * Props for the WizardContainer component.
 *
 * WizardContainer manages the state and navigation logic for a multi-step wizard.
 * It provides wizard context to all child components via React Context.
 */
type WizardContainerProps = {
  /**
   * Array of wizard steps defining the flow.
   * Each step should have a unique ID that matches the stepId used in WizardStepContent components.
   */
  steps: WizardStep[];
  /** Child components that can use the wizard context via useWizard hook. */
  children: ReactNode;
  /**
   * Optional callback invoked when the user completes the wizard.
   * This is called when goNext() is called on the last step.
   */
  onComplete?: () => void;
};

export function WizardContainer({
  steps: initialSteps,
  children,
  onComplete,
}: WizardContainerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState(initialSteps);

  const goToStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
    }
  };

  const goNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onComplete?.();
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const updateStepValidity = (stepId: string, isValid: boolean) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, isValid } : step))
    );
  };

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const canProceed = currentStep?.isValid ?? false;

  return (
    <WizardContext.Provider
      value={{
        currentStepIndex,
        steps,
        goToStep,
        goNext,
        goBack,
        isFirstStep,
        isLastStep,
        currentStep,
        updateStepValidity,
        canProceed,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}
