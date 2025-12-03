"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWizard } from "./wizard-container";

export function WizardProgress() {
  const { steps, currentStepIndex, goToStep } = useWizard();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isComplete = index < currentStepIndex || step.isValid;
          const isClickable = index < currentStepIndex;

          return (
            <div className="flex flex-1 items-center" key={step.id}>
              <button
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 font-medium text-sm transition-colors",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground",
                  isComplete &&
                    !isActive &&
                    "border-primary bg-primary/10 text-primary",
                  !(isActive || isComplete) &&
                    "border-muted-foreground/30 text-muted-foreground"
                )}
                disabled={!isClickable}
                onClick={() => isClickable && goToStep(index)}
                type="button"
              >
                {isComplete && !isActive ? (
                  <Check className="size-4" />
                ) : (
                  index + 1
                )}
              </button>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors",
                    index < currentStepIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-center">
        <p className="font-medium text-sm">{steps[currentStepIndex]?.title}</p>
        {steps[currentStepIndex]?.description && (
          <p className="text-muted-foreground text-xs">
            {steps[currentStepIndex].description}
          </p>
        )}
      </div>
    </div>
  );
}
