"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useWizard } from "./wizard-container";

/**
 * Props for the WizardNavigation component.
 *
 * Uses explicit TypeScript types instead of Zod schema for better type inference
 * and to avoid runtime validation overhead in a client component.
 */
export type WizardNavigationProps = {
  /**
   * Callback function invoked when the user submits the wizard on the final step.
   * If provided, clicking the submit button on the last step will call this function
   * instead of the default onComplete handler from WizardContainer.
   */
  onSubmit?: () => void | Promise<void>;
  /**
   * Label text for the submit button on the final step.
   * Defaults to "Save" if not provided.
   */
  submitLabel?: string;
  /**
   * Whether the form is currently being submitted.
   * When true, disables navigation buttons and shows a loading spinner.
   */
  isSubmitting?: boolean;
};

export function WizardNavigation({
  onSubmit,
  submitLabel = "Save",
  isSubmitting = false,
}: WizardNavigationProps) {
  const { isFirstStep, isLastStep, goBack, goNext, canProceed } = useWizard();

  const handleNext = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else {
      goNext();
    }
  };

  let buttonContent: ReactNode;
  if (isSubmitting) {
    buttonContent = <Loader2 className="mr-1 size-4 animate-spin" />;
  } else if (isLastStep) {
    buttonContent = submitLabel;
  } else {
    buttonContent = (
      <>
        Next
        <ChevronRight className="ml-1 size-4" />
      </>
    );
  }

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <Button
        disabled={isFirstStep || isSubmitting}
        onClick={goBack}
        type="button"
        variant="outline"
      >
        <ChevronLeft className="mr-1 size-4" />
        Back
      </Button>

      <Button
        disabled={!canProceed || isSubmitting}
        onClick={handleNext}
        type="button"
      >
        {buttonContent}
      </Button>
    </div>
  );
}
