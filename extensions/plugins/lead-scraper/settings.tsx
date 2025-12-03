"use client";

import type { WizardStep as WizardStepType } from "@/extensions/components/wizard/wizard-container";
import { WizardContainer } from "@/extensions/components/wizard/wizard-container";
import { WizardNavigation } from "@/extensions/components/wizard/wizard-navigation";
import { WizardProgress } from "@/extensions/components/wizard/wizard-progress";
import { WizardStep } from "@/extensions/components/wizard/wizard-step";
import { AccountStep } from "./wizard-steps/account-step";
import { ConnectStep } from "./wizard-steps/connect-step";
import { OrgStep } from "./wizard-steps/org-step";
import { WorkspaceStep } from "./wizard-steps/workspace-step";

type LeadScraperSettingsProps = {
  config?: Record<string, unknown>;
  onConfigChange?: (key: string, value: unknown) => void;
  disabled?: boolean;
};

const WIZARD_STEPS: WizardStepType[] = [
  {
    id: "connect",
    title: "Connect",
    description: "Configure API endpoint and credentials",
    isValid: false,
  },
  {
    id: "organization",
    title: "Organization",
    description: "Select your organization",
    isValid: false,
  },
  {
    id: "account",
    title: "Account",
    description: "Select tenant and account",
    isValid: false,
  },
  {
    id: "workspace",
    title: "Workspace",
    description: "Optionally select a workspace",
    isValid: true, // Optional step
  },
];

export function LeadScraperSettings({
  config = {},
  onConfigChange,
  disabled,
}: LeadScraperSettingsProps) {
  const handleUpdateConfig = (key: string, value: unknown) => {
    if (!disabled && onConfigChange) {
      onConfigChange(key, value);
    }
  };

  return (
    <WizardContainer steps={WIZARD_STEPS}>
      <WizardProgress />

      <WizardStep stepId="connect">
        <ConnectStep config={config} onUpdateConfig={handleUpdateConfig} />
      </WizardStep>

      <WizardStep stepId="organization">
        <OrgStep config={config} onUpdateConfig={handleUpdateConfig} />
      </WizardStep>

      <WizardStep stepId="account">
        <AccountStep config={config} onUpdateConfig={handleUpdateConfig} />
      </WizardStep>

      <WizardStep stepId="workspace">
        <WorkspaceStep config={config} onUpdateConfig={handleUpdateConfig} />
      </WizardStep>

      <WizardNavigation submitLabel="Save Configuration" />
    </WizardContainer>
  );
}
