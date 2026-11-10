import { api } from "@/src/utils/api";
import {
  PRODUCT_MODULES,
  type InstanceLink,
  type UiCustomization,
} from "@/src/commercial/productModules";

export {
  PRODUCT_MODULES,
  type InstanceLink,
  type ProductModule,
  type UiCustomization,
} from "@/src/commercial/productModules";

const defaultUiCustomization: UiCustomization = {
  instanceLinks: null,
  visibleModules: [...PRODUCT_MODULES],
};

export function useUiCustomization(): UiCustomization {
  const customization = api.uiCustomization.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
    staleTime: 60 * 60 * 1000,
  });
  return customization.data ?? defaultUiCustomization;
}

export function findCurrentInstance(
  links: InstanceLink[],
  currentHost: string | undefined,
): InstanceLink | undefined {
  if (!currentHost) return undefined;

  return links.find((link) => {
    try {
      return new URL(link.url).host === currentHost;
    } catch {
      return false;
    }
  });
}
