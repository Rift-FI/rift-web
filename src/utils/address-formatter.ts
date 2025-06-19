interface FormatOpts {
  /** Shorten the string with a middle ellipsis (default = true) */
  shorten?: boolean;
  /** Visible chars at the front (default = 4) */
  leading?: number;
  /** Visible chars at the end  (default = 4) */
  trailing?: number;
}

export default function formatAddress(
  address: string,
  chain?: string,
  opts: FormatOpts = {}
) {
  // TODO: Check chain for now treat as eth address
  const { shorten = true, leading = 4, trailing = 4 } = opts;

  const canonical = address;

  if (!shorten) return canonical;

  // Guard against asking for more chars than exist
  const l = Math.min(leading, canonical.length);
  const t = Math.min(trailing, canonical.length - l);

  return `${canonical.slice(0, l)}…${canonical.slice(-t)}`;
}
