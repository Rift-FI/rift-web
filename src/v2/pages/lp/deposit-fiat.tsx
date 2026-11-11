import { useEffect, useId, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Field, INPUT_CLASS, SideSheet, formatMoney } from "@/v2/ui";
import { CurrencyPicker } from "@/v2/ui/currency-picker";
import { Monogram, Picker } from "@/v2/ui/picker";
import { useCountries } from "@/v2/lib/countries";
import { LP_FIAT_CURRENCIES, lpApi, type LpSession } from "@/v2/lib/lp";

/** Used when /v1/payouts/countries doesn't list a currency (e.g. GHS on the fallback list). */
const FALLBACK_RAILS: Record<string, { phoneCode: string; networks: string[] }> = {
  KES: { phoneCode: "+254", networks: ["Safaricom", "Airtel"] },
  UGX: { phoneCode: "+256", networks: ["MTN", "Airtel"] },
  TZS: { phoneCode: "+255", networks: ["Vodacom", "Halotel", "Airtel", "Yas"] },
  GHS: { phoneCode: "+233", networks: ["MTN", "AirtelTigo", "Telecel"] },
  MWK: { phoneCode: "+265", networks: ["TNM", "Airtel"] },
};

interface Prompt {
  amount: number;
  currency: string;
  phone: string;
  message?: string;
}

export function FiatDepositSheet({ open, onClose, session }: { open: boolean; onClose: () => void; session: LpSession }) {
  const qc = useQueryClient();
  const amountId = useId();
  const phoneId = useId();
  const { countries } = useCountries();
  const [currency, setCurrency] = useState<string>("KES");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<Prompt | null>(null);

  const rails = useMemo(() => {
    const c = countries.find((x) => x.currency === currency);
    const fb = FALLBACK_RAILS[currency];
    return { phoneCode: c?.phoneCode || fb?.phoneCode || "", networks: c?.rails.mobile.length ? c.rails.mobile : fb?.networks ?? [] };
  }, [countries, currency]);

  useEffect(() => setNetwork((n) => (rails.networks.includes(n) ? n : rails.networks[0] ?? "")), [rails]);
  useEffect(() => {
    if (!open) {
      setPrompt(null);
      setError(null);
      setBusy(false);
    }
  }, [open]);

  // While the phone prompt is out, refresh the position so the deposit appears.
  useEffect(() => {
    if (!prompt) return;
    const t = setInterval(() => qc.invalidateQueries({ queryKey: ["lp", "me"] }), 8000);
    return () => clearInterval(t);
  }, [prompt, qc]);

  const amt = Number(amount.replace(/,/g, ""));
  const digits = phone.replace(/\D/g, "");
  const fullPhone = () => {
    const code = rails.phoneCode.replace(/\D/g, "");
    if (code && digits.startsWith(code)) return `+${digits}`;
    return `+${code}${digits.replace(/^0+/, "")}`;
  };
  const valid = amt > 0 && digits.length >= 9 && (!rails.networks.length || !!network);

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const phoneE164 = fullPhone();
      const r = await lpApi.depositFiat(session, { currency, amount: amt, phone: phoneE164, network });
      setPrompt({ amount: amt, currency, phone: phoneE164, message: typeof r?.message === "string" ? r.message : undefined });
      qc.invalidateQueries({ queryKey: ["lp", "me"] });
    } catch (e: any) {
      setError(e?.message || "Couldn't start the payment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SideSheet open={open} onClose={onClose} title="Deposit local money" description="Pay from mobile money. We convert it to USD at the recorded rate." testId="lp-fiat-sheet">
      {prompt ? (
        <div className="flex flex-col items-center py-6 text-center" data-testid="lp-fiat-prompt">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-accent-primary">
            <Smartphone className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-3 text-[16px] font-semibold text-ink">Approve the prompt on your phone</p>
          <p className="mt-1 max-w-sm text-[14px] leading-relaxed text-ink-3">
            We sent a request for {formatMoney(prompt.amount, prompt.currency)} to {prompt.phone}. Enter your PIN to pay.
            {prompt.message ? ` ${prompt.message}` : ""}
          </p>
          <p className="mt-3 max-w-sm text-[13px] text-ink-3">
            Once it completes, the USD amount is credited and shows under Deposits. Its 30-day lock starts then.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" onClick={() => setPrompt(null)}>
              New deposit
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3">
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">Currency</p>
              <CurrencyPicker value={currency} onChange={setCurrency} codes={[...LP_FIAT_CURRENCIES]} testId="lp-fiat-currency" compact />
            </div>
            <Field label="Amount" htmlFor={amountId}>
              <input
                id={amountId}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                data-testid="lp-fiat-amount"
                className={cn(INPUT_CLASS, "text-[17px] font-semibold tabular-numeric")}
              />
            </Field>
          </div>
          {rails.networks.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[13px] font-medium text-ink-2">Mobile network</p>
              <Picker
                value={network}
                onChange={setNetwork}
                label="Mobile network"
                testId="lp-fiat-network"
                options={rails.networks.map((n) => ({ value: n, label: n, icon: <Monogram text={n} className="h-7 w-7 text-[11px]" /> }))}
              />
            </div>
          )}
          <Field label="Phone number" htmlFor={phoneId} hint="The mobile-money number you'll pay from.">
            <div className="flex h-11 items-center rounded-md border border-hairline-strong bg-card focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-accent-primary/25">
              {rails.phoneCode && <span className="pl-3 pr-1 text-[15px] text-ink-3 tabular-numeric">{rails.phoneCode}</span>}
              <input
                id={phoneId}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="712 345 678"
                data-testid="lp-fiat-phone"
                className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
              />
            </div>
          </Field>
          <p className="text-[12.5px] leading-relaxed text-ink-3">
            No Rift fee on LP deposits. The provider{"’"}s collection fee and exchange rate apply; the exact USD amount is shown once the payment completes.
          </p>
          {error && (
            <p role="alert" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" block disabled={!valid || busy} data-testid="lp-fiat-submit">
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {amt > 0 ? `Pay ${formatMoney(amt, currency)}` : "Continue"}
          </Button>
        </form>
      )}
    </SideSheet>
  );
}
