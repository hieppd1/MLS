import Link from "next/link";
import { useTranslations } from "next-intl";

interface ActionButtonsProps {
  /** Link to detail / view page */
  viewHref?: string;
  /** Link to edit page OR inline edit handler */
  editHref?: string;
  onEdit?: () => void;
  /** Delete handler — hidden when undefined */
  onDelete?: () => void;
  /** Pass false to hide the delete button (e.g. SuperAdmin row) */
  canDelete?: boolean;
}

const eyeIcon = (
  <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const editIcon = (
  <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const trashIcon = (
  <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const btnBase =
  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium transition";

export function ActionButtons({
  viewHref,
  editHref,
  onEdit,
  onDelete,
  canDelete = true,
}: ActionButtonsProps) {
  const t = useTranslations("admin_common");
  return (
    <div className="flex items-center justify-end gap-1.5">
      {viewHref && (
        <Link
          href={viewHref}
          className={`${btnBase} border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700`}
        >
          {eyeIcon}
          {t("btn_view")}
        </Link>
      )}

      {editHref && (
        <Link
          href={editHref}
          className={`${btnBase} border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100`}
        >
          {editIcon}
          {t("btn_edit")}
        </Link>
      )}

      {!editHref && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className={`${btnBase} border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100`}
        >
          {editIcon}
          {t("btn_edit")}
        </button>
      )}

      {onDelete && canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className={`${btnBase} border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100`}
        >
          {trashIcon}
          {t("btn_delete")}
        </button>
      )}
    </div>
  );
}
