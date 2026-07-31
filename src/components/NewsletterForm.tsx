"use client";

import { useState } from "react";
import { Input } from "@/components/ui/primitives/input";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

type Props = {
  variant?: "footer" | "inline";
};

export function NewsletterForm({ variant = "inline" }: Props) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot anti-bot (jamais rempli par un humain)
  const [successMessage, setSuccessMessage] = useState("");
  const { isLoading, isSuccess, isError, error, run } = useAsyncAction();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await run(async () => {
        const res = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, website }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        setSuccessMessage("Inscription réussie !");
        setEmail("");
      });
    } catch {
      // error state handled by hook
    }
  }

  const isFooter = variant === "footer";

  return (
    <form onSubmit={handleSubmit} className={isFooter ? "mt-3" : "mt-4"}>
      {/* Honeypot anti-bot : invisible pour un humain, souvent rempli par les robots → rejet silencieux côté serveur. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />
      <div className={`flex gap-2 ${isFooter ? "flex-col sm:flex-row" : ""}`}>
        {isFooter ? (
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            variant="footer"
            className="flex-1"
            aria-label="Adresse email pour la newsletter"
          />
        ) : (
          <FormField label="Email" htmlFor="newsletter_email" className="flex-1">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
            />
          </FormField>
        )}
        <Button
          type="submit"
          loading={isLoading}
          variant={isFooter ? "primary" : "primary"}
          size={isFooter ? "md" : "md"}
          className={isFooter ? "shrink-0" : "shrink-0"}
        >
          S&apos;inscrire
        </Button>
      </div>
      <p className={`mt-2 text-[11px] leading-snug ${isFooter ? "text-white/50" : "text-site-muted"}`}>
        En vous inscrivant, vous acceptez notre{" "}
        <a href="/confidentialite" className="underline hover:no-underline">
          politique de confidentialité
        </a>
        .
      </p>
      {isSuccess && successMessage && (
        <Alert variant="success" className="mt-2">
          {successMessage}
        </Alert>
      )}
      {isError && error && (
        <Alert variant="error" className="mt-2">
          {error}
        </Alert>
      )}
    </form>
  );
}
