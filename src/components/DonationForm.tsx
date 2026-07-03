"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n-client";
import { Input } from "@/components/ui/primitives/input";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

export function DonationForm() {
  const { t } = useTranslations();
  const d = t.donate;
  const df = t.donateForm;
  const pay = t.pages.engageExtra;
  const [successMessage, setSuccessMessage] = useState("");
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();
  const [form, setForm] = useState({
    amount: "10",
    currency: "USD",
    provider: "orange",
    phone: "",
    donor_name: "",
    donor_email: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch("/api/donations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.mode === "production" && data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }

        setSuccessMessage(data.message || df.thanks);
      });
    } catch {
      // handled by hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={d.amount} htmlFor="donation_amount" required>
          <Input
            type="number"
            min="1"
            required
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </FormField>
        <FormField label={df.currency} htmlFor="donation_currency">
          <NativeSelect
            id="donation_currency"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          >
            <option value="USD">USD</option>
            <option value="CDF">CDF</option>
          </NativeSelect>
        </FormField>
      </div>

      <FormField label={df.providerLabel} htmlFor="donation_provider" required>
        <NativeSelect
          id="donation_provider"
          required
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
        >
          <option value="orange">{d.orange}</option>
          <option value="mpesa">{d.mpesa}</option>
          <option value="airtel">{d.airtel}</option>
        </NativeSelect>
      </FormField>

      <FormField label={d.phone} htmlFor="donation_phone" required>
        <Input
          type="tel"
          required
          placeholder="+243..."
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={df.donorName} htmlFor="donation_donor_name">
          <Input
            value={form.donor_name}
            onChange={(e) => setForm({ ...form, donor_name: e.target.value })}
          />
        </FormField>
        <FormField label={df.donorEmail} htmlFor="donation_donor_email">
          <Input
            type="email"
            value={form.donor_email}
            onChange={(e) => setForm({ ...form, donor_email: e.target.value })}
          />
        </FormField>
      </div>

      <p className="text-xs text-cfm-earth">
        {process.env.NEXT_PUBLIC_MOBILE_MONEY_MODE === "production"
          ? pay.prodPayment
          : pay.demoPayment}
      </p>

      <Button type="submit" loading={isLoading} className="w-full">
        {df.submitMobile}
      </Button>

      {isSuccess && successMessage && <Alert variant="success">{successMessage}</Alert>}
      {isError && error && <Alert variant="error">{error}</Alert>}
    </form>
  );
}
