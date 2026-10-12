import Header from "@/src/components/layouts/header";
import { t } from "@/src/features/i18n";
import React from "react";

export const SettingsDangerZone: React.FC<{
  items: {
    title: string;
    description: string;
    button: React.ReactNode;
  }[];
}> = ({ items }) => {
  return (
    <div className="space-y-3">
      <Header title="Danger Zone" />
      <div className="rounded-lg border">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 border-b p-3 last:border-b-0"
          >
            <div>
              <h4 className="font-bold">{t(item.title)}</h4>
              <p className="text-sm">{t(item.description)}</p>
            </div>
            {item.button}
          </div>
        ))}
      </div>
    </div>
  );
};
