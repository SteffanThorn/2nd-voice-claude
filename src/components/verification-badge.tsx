import type { VerificationStatus } from "@/features/content/types";

const STYLES: Record<VerificationStatus, { label: string; className: string }> = {
  verified: { label: "Verified", className: "bg-accent-soft text-accent" },
  under_review: { label: "Under review", className: "bg-warn-soft text-warn" },
  unverified: { label: "Unverified", className: "bg-warn-soft text-warn" },
  needs_revision: { label: "Needs revision", className: "bg-warn-soft text-warn" },
  rejected: { label: "Rejected", className: "bg-warn-soft text-warn" },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>
  );
}
