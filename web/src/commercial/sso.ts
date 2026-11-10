import { type Provider } from "next-auth/providers/index";

export async function loadSsoProviders(): Promise<Provider[]> {
  return [];
}

export async function isAnySsoConfigured(): Promise<boolean> {
  return false;
}

export async function getSsoAuthProviderIdForDomain(
  _domain: string,
): Promise<string | null> {
  return null;
}

export async function findMultiTenantSsoConfig(_params: {
  providerId: string;
}): Promise<
  | { isMultiTenantSsoProvider: true; domain: string }
  | { isMultiTenantSsoProvider: false; domain: null }
> {
  return { isMultiTenantSsoProvider: false, domain: null };
}
