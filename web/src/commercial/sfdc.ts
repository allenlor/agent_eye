type SfdcSync = {
  upsertOrg: (input: object) => Promise<unknown>;
  upsertUser: (input: object) => Promise<unknown>;
  setUserRole: (input: object) => Promise<unknown>;
  removeUser: (input: object) => Promise<unknown>;
};

export function getSfdcService(): SfdcSync | null {
  return null;
}
