/**
 * RANGA icon system — Lucide only (plus the GitHub mark, which Lucide no longer ships), one light stroke
 * weight (1.5), one default size. Import icons from here, never directly from lucide-react, so the set
 * stays coherent.
 */
import {
  ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, ChevronRight, ChevronLeft, CircleAlert, ClipboardList, Copy,
  Download, ExternalLink, Eye, EyeOff, File, FileText, Files, FlaskConical, Folder, GraduationCap, House, Info,
  Layers, LibraryBig, Notebook, RefreshCw, Search, ShieldCheck, WifiOff, X, BookCopy, Smartphone,
  Pencil, Plus, Trash2, Upload, Wrench, LogOut, Settings,
  type LucideIcon, type LucideProps,
} from "lucide-react";
import type { SVGProps } from "react";
import type { ResourceType } from "../../types";

export type IconProps = Omit<LucideProps, "ref">;

const wrap = (Icon: LucideIcon) => (props: IconProps) => (
  <Icon strokeWidth={1.5} size={20} aria-hidden="true" {...props} />
);

export const HomeIcon = wrap(House);
export const BrowseIcon = wrap(LibraryBig);
export const DocumentsIcon = wrap(Files);
export const SearchIcon = wrap(Search);
export const SubjectIcon = wrap(BookOpen);
export const SemesterIcon = wrap(Layers);
export const DownloadIcon = wrap(Download);
export const ExternalIcon = wrap(ExternalLink);
export const FileIcon = wrap(FileText);
export const BackIcon = wrap(ArrowLeft);
export const ForwardIcon = wrap(ArrowRight);
export const ChevronIcon = wrap(ChevronRight);
export const ChevronLeftIcon = wrap(ChevronLeft);
export const ChevronDownIcon = wrap(ChevronDown);
export const FolderIcon = wrap(Folder);
export const CloseIcon = wrap(X);
export const InfoIcon = wrap(Info);
export const RetryIcon = wrap(RefreshCw);
export const OfflineIcon = wrap(WifiOff);
export const WarningIcon = wrap(CircleAlert);
export const VerifiedIcon = wrap(ShieldCheck);
export const InstallIcon = wrap(Smartphone);
export const ProgrammeIcon = wrap(GraduationCap);
export const DeveloperIcon = wrap(Wrench);
export const EditIcon = wrap(Pencil);
export const AddIcon = wrap(Plus);
export const DeleteIcon = wrap(Trash2);
export const UploadIcon = wrap(Upload);
export const SignOutIcon = wrap(LogOut);
export const CheckIcon = wrap(Check);
export const CopyIcon = wrap(Copy);
export const EyeIcon = wrap(Eye);
export const EyeOffIcon = wrap(EyeOff);
export const SettingsIcon = wrap(Settings);

/** The GitHub mark (Simple Icons path, 24×24). Uses currentColor. */
export function GithubIcon({ size = 18, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const TYPE_ICONS: Record<ResourceType, LucideIcon> = {
  pyq: ClipboardList,
  notes: Notebook,
  study_material: BookCopy,
  lab: FlaskConical,
  other: File,
};

export function ResourceTypeIcon({ type, ...props }: { type: ResourceType | string } & IconProps) {
  const Icon = TYPE_ICONS[type as ResourceType] ?? File;
  return <Icon strokeWidth={1.5} size={20} aria-hidden="true" {...props} />;
}
