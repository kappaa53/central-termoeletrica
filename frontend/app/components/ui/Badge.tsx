import type { GroupStatus } from "@/app/types/reading";
import {
  groupStatusLabels,
  groupStatusStyles,
} from "@/app/lib/constants/statuses";

type BadgeProps = {
  status: GroupStatus;
};

export default function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${groupStatusStyles[status]}`}
    >
      {groupStatusLabels[status]}
    </span>
  );
}