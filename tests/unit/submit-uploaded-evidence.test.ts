import { describe, expect, it, vi } from "vitest";
import { submitUploadedEvidence } from "@/lib/pilots/submit-uploaded-evidence";

function fixture(valid = true) {
  const reference = { value: "existing-reference" } as HTMLInputElement;
  const file = { disabled: false } as HTMLInputElement;
  const setBypass = vi.fn();
  const form = {
    reportValidity: vi.fn(() => valid),
    elements: { namedItem: vi.fn(() => reference) },
    requestSubmit: vi.fn()
  } as unknown as HTMLFormElement;
  const submit = () => submitUploadedEvidence(form, new Map([["report_link", "new-reference"]]), [file, null], setBypass);
  return { form, reference, file, setBypass, submit };
}

describe("visit evidence submission after an async upload", () => {
  it("submits valid forms with references and without resending file bodies", () => {
    const f = fixture();
    f.submit();
    expect(f.reference.value).toBe("new-reference");
    expect(f.file.disabled).toBe(true);
    expect(f.setBypass).toHaveBeenCalledWith(true);
    expect(f.form.requestSubmit).toHaveBeenCalledOnce();
  });

  it("keeps inputs usable when a required field was cleared during upload", () => {
    const f = fixture(false);
    expect(f.submit).toThrow("highlighted fields");
    expect(f.file.disabled).toBe(false);
    expect(f.reference.value).toBe("existing-reference");
    expect(f.setBypass).not.toHaveBeenCalled();
    expect(f.form.requestSubmit).not.toHaveBeenCalled();
    vi.mocked(f.form.reportValidity).mockReturnValue(true);
    f.submit();
    expect(f.form.requestSubmit).toHaveBeenCalledOnce();
  });

  it("restores references and retry state if submission throws", () => {
    const f = fixture();
    vi.mocked(f.form.requestSubmit).mockImplementation(() => { throw new Error("Submit failed"); });
    expect(f.submit).toThrow("Submit failed");
    expect(f.reference.value).toBe("existing-reference");
    expect(f.file.disabled).toBe(false);
    expect(f.setBypass.mock.calls).toEqual([[true], [false]]);
  });

  it("does not disable file inputs if a reference field is missing", () => {
    const f = fixture();
    vi.mocked(f.form.elements.namedItem).mockReturnValue(null);
    expect(f.submit).toThrow("incomplete");
    expect(f.file.disabled).toBe(false);
    expect(f.setBypass).not.toHaveBeenCalled();
  });
});
