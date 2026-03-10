export interface FormatMsOptions {
  withUnit?: boolean;
}

export const formatMs = (value: number, options?: FormatMsOptions): string => {
  const { withUnit = true } = options ?? {};
  const rounded = Math.round(value);

  return withUnit ? `${rounded}ms` : `${rounded}`;
};

