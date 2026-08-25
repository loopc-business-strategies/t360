import { ComponentType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState } from "@t360/ui";
import { apiFetch, getAdminToken } from "../lib/api";

/** Client-side deep-link gate; backend still enforces permissions. */
export function RequirePerm({
  anyOf,
  children,
  fallback,
}: {
  anyOf: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const me = useQuery({
    queryKey: ["admin-me-perm-gate"],
    queryFn: () => apiFetch<{ permissions: string[] }>("/users/me"),
    enabled: Boolean(getAdminToken()),
  });

  if (me.isLoading) return <LoadingState label="Checking access…" />;
  if (me.isError) {
    return <ErrorState title="Access check failed" description={me.error.message} />;
  }
  const perms = me.data?.data?.permissions ?? [];
  const ok = anyOf.some((p) => perms.includes(p));
  if (!ok) {
    return (
      fallback ?? (
        <ErrorState title="Forbidden" description="You do not have permission to view this page." />
      )
    );
  }
  return <>{children}</>;
}

export function withRequirePerm<P extends object>(anyOf: string[], Page: ComponentType<P>) {
  return function GatedPage(props: P) {
    return (
      <RequirePerm anyOf={anyOf}>
        <Page {...props} />
      </RequirePerm>
    );
  };
}
