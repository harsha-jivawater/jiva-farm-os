export type ImportActionState = {
  status: "idle" | "success" | "error";
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  rowErrors: string[];
  reviewBatchHref?: string | null;
  reviewBatchId?: string | null;
  reviewRowCount?: number;
};
