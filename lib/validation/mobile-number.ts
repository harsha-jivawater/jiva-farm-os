export type IndianMobileValidationResult =
  | {
      error: null;
      normalized: string;
      valid: true;
    }
  | {
      error: string;
      normalized: null;
      valid: false;
    };

export function normalizeIndianMobileNumber(
  value: string | null | undefined
) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  if (!/^\+?[0-9 -]+$/.test(rawValue)) {
    return null;
  }

  if ((rawValue.match(/\+/g) ?? []).length > 1) {
    return null;
  }

  if (rawValue.includes("+") && !rawValue.startsWith("+")) {
    return null;
  }

  let digits = rawValue.replace(/[ -]/g, "");

  if (digits.startsWith("+91")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("091")) {
    digits = digits.slice(3);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function validateIndianMobileNumber(
  value: string | null | undefined,
  label = "Mobile number"
): IndianMobileValidationResult {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return {
      error: `${label} is required.`,
      normalized: null,
      valid: false
    };
  }

  const normalized = normalizeIndianMobileNumber(value);

  if (!normalized) {
    return {
      error: `${label} must be a valid 10-digit Indian mobile number.`,
      normalized: null,
      valid: false
    };
  }

  return {
    error: null,
    normalized,
    valid: true
  };
}

export function normalizeOptionalIndianMobileNumber(
  value: string | null | undefined
) {
  const normalized = normalizeIndianMobileNumber(value);

  return normalized || null;
}
