const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|token|secret|password|api[-_]?key|session|bearer)/i;

const REDACTED_VALUE = "[REDACTED]";

const scrubValue = (
  value: unknown,
  seen: WeakSet<object>,
  key?: string
): unknown => {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED_VALUE;
  }

  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, seen));
  }

  if (value && typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(
        ([entryKey, entryValue]) => [
          entryKey,
          scrubValue(entryValue, seen, entryKey),
        ]
      )
    );
  }

  return value;
};

export const scrubLogPayload = <T>(value: T): T => {
  const seen = new WeakSet<object>();
  return scrubValue(value, seen) as T;
};

export const isSensitiveLogField = (fieldName: string) =>
  SENSITIVE_KEY_PATTERN.test(fieldName);
