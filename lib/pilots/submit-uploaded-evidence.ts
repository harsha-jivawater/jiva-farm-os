// Uploads are asynchronous: required fields may have changed in the meantime.
// Commit references only when the current form can actually be submitted.
export function submitUploadedEvidence(
  form: HTMLFormElement,
  references: Map<string, string>,
  fileInputs: Array<HTMLInputElement | null>,
  setBypass: (value: boolean) => void
) {
  if (!form.reportValidity()) {
    throw new Error("Please complete the highlighted fields and submit the report again.");
  }
  const previousValues = Array.from(references, ([name, reference]) => {
    const input = form.elements.namedItem(name) as HTMLInputElement | null;
    if (!input) throw new Error("The visit report form is incomplete. Please reload it.");
    return { input, previous: input.value, reference };
  });
  const previousDisabled = fileInputs.map((input) => input?.disabled ?? false);
  try {
    for (const { input, reference } of previousValues) input.value = reference;
    fileInputs.forEach((input) => { if (input) input.disabled = true; });
    setBypass(true);
    form.requestSubmit();
  } catch (error) {
    setBypass(false);
    for (const { input, previous } of previousValues) input.value = previous;
    fileInputs.forEach((input, index) => {
      if (input) input.disabled = previousDisabled[index];
    });
    throw error;
  }
}
