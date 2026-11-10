import { api } from "@/src/utils/api";

export function SSOSettings(_props: { orgId: string }) {
  return (
    <p className="text-muted-foreground max-w-2xl text-sm">
      AgentEye sign-in providers are configured on this instance with the
      AUTH_* environment variables. Organization-specific SSO is not included
      in this build.
    </p>
  );
}

type AuditRow = {
  id: string;
  createdAt: Date | string;
  action: string;
  resourceType: string;
  resourceId: string;
  actor: {
    type: string;
    body: {
      email?: string | null;
      name?: string | null;
      publicKey?: string | null;
    };
  } | null;
};

function actorLabel(actor: AuditRow["actor"]): string {
  if (!actor) return "Unknown";
  if (actor.type === "USER") {
    return actor.body.email ?? actor.body.name ?? "User";
  }
  return actor.body.publicKey ?? "API key";
}

function AuditLogTable({
  rows,
  isLoading,
  isError,
}: {
  rows: AuditRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
}) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading audit logs…</p>;
  }
  if (isError) {
    return (
      <p className="text-muted-foreground text-sm">
        Audit logs could not be loaded.
      </p>
    );
  }
  if (!rows || rows.length === 0) {
    return <p className="text-muted-foreground text-sm">No audit logs yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-muted-foreground border-b">
          <tr>
            <th className="py-2 pr-4 font-medium">Time</th>
            <th className="py-2 pr-4 font-medium">Actor</th>
            <th className="py-2 pr-4 font-medium">Action</th>
            <th className="py-2 font-medium">Resource</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="py-2 pr-4 whitespace-nowrap">
                {new Date(row.createdAt).toLocaleString()}
              </td>
              <td className="py-2 pr-4">{actorLabel(row.actor)}</td>
              <td className="py-2 pr-4">{row.action}</td>
              <td className="py-2">
                {row.resourceType} {row.resourceId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrgAuditLogsSettingsPage({ orgId }: { orgId: string }) {
  const logs = api.auditLogs.allByOrg.useQuery({
    orgId,
    page: 0,
    limit: 50,
  });

  return (
    <AuditLogTable
      rows={logs.data?.data}
      isLoading={logs.isLoading}
      isError={logs.isError}
    />
  );
}

export function AuditLogsSettingsPage({ projectId }: { projectId: string }) {
  const logs = api.auditLogs.all.useQuery({
    projectId,
    page: 0,
    limit: 50,
  });

  return (
    <AuditLogTable
      rows={logs.data?.data}
      isLoading={logs.isLoading}
      isError={logs.isError}
    />
  );
}
