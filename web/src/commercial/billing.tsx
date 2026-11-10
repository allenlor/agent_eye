import { AlertCircle } from "lucide-react";

import { Alert } from "@/src/components/design-system/Alert/Alert";

export function useIsCloudBillingAvailable(): boolean {
  return false;
}

export function SupportOrUpgradePage() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Alert icon={AlertCircle}>
          <Alert.Title>Access restricted</Alert.Title>
          <Alert.Description>
            This feature is not included in this build. Ask an administrator
            for access.
          </Alert.Description>
        </Alert>
      </div>
    </div>
  );
}

export function BillingSettings() {
  return null;
}
