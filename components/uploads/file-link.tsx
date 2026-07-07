import { ExternalLink } from "lucide-react";

export function FileLink({
  href,
  label = "Open file"
}: {
  href?: string | null;
  label?: string;
}) {
  if (!href) {
    return "Not set";
  }

  return (
    <a
      className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {label}
      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}
