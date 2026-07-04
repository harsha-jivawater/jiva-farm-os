type LoadingSpinnerProps = {
  className?: string;
  label?: string;
};

type LoadingStateProps = {
  message?: string;
};

export function LoadingSpinner({
  className = "",
  label = "Loading"
}: LoadingSpinnerProps) {
  return (
    <span
      aria-label={label}
      className={[
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      ].join(" ")}
      role="status"
    />
  );
}

export function LoadingState({
  message = "Loading Jiva Farm OS..."
}: LoadingStateProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-10">
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
        <LoadingSpinner className="text-brand-600" />
        <span>{message}</span>
      </div>
    </div>
  );
}
