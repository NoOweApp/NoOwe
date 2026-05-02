import * as SMS from "expo-sms";
import { useCallback } from "react";

// Matches your settings.tsx PaymentMethod type exactly
type PaymentMethod = {
  service: string; // "venmo" | "paypal" | "zelle" | "cashapp" | "other"
  user: string;
};

type Person = {
  name: string | null;
  phone: string;
  oweAmount?: number;
};

export type SmsResult = {
  person: Person;
  result: "sent" | "cancelled" | "failed" | "unavailable";
};

type SendRemindersOptions = {
  people: Person[];
  billDescription: string;
  messageBody: string;
  selectedPaymentMethods: PaymentMethod[];
  onProgress?: (index: number, total: number, person: Person) => void;
  onComplete?: (results: SmsResult[]) => void;
};

// Maps service key → deep link URL builder
const PAYMENT_URLS: Record<string, (user: string) => string> = {
  venmo:   (u) => `https://venmo.com/${u.replace("@", "")}`,
  paypal:  (u) => `https://paypal.me/${u.replace("@", "")}`,
  cashapp: (u) => `https://cash.app/${u.startsWith("$") ? u : "$" + u}`,
  zelle:   (u) => u, // Zelle is phone/email only, no deep link
  other:   (u) => u,
};

export function useSmsReminder() {
  const sendReminders = useCallback(
    async (opts: SendRemindersOptions): Promise<SmsResult[]> => {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        const results = opts.people.map((person) => ({
          person,
          result: "unavailable" as const,
        }));
        opts.onComplete?.(results);
        return results;
      }

      const results: SmsResult[] = [];

      for (let i = 0; i < opts.people.length; i++) {
        const person = opts.people[i];
        opts.onProgress?.(i, opts.people.length, person);

        // Build payment footer from your { service, user } shape
        const paymentLines = opts.selectedPaymentMethods
          .map((pm) => {
            const urlBuilder = PAYMENT_URLS[pm.service] ?? ((u: string) => u);
            const url = urlBuilder(pm.user);
            const label =
              pm.service.charAt(0).toUpperCase() + pm.service.slice(1);
            // Zelle & Other: just show the handle, no URL
            return pm.service === "zelle" || pm.service === "other"
              ? `${label}: ${pm.user}`
              : `${label}: ${url}`;
          })
          .join("\n");

        // Substitute ${oweAmount} placeholder with this person's amount, the
        // same way the payment footer is appended — resolved per-person at send time.
        console.log(JSON.stringify(person))
        const resolvedBody = opts.messageBody.replace(
          "${oweAmount}",
          person.oweAmount != null ? `$${person.oweAmount.toFixed(2)}` : "your share"
        );

        const fullMessage = [
          resolvedBody,
          paymentLines ? `\n— Pay me back —\n${paymentLines}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        // ← This is the MFMessageComposeViewController call.
        // sendSMSAsync resolves ONLY after the user sends or dismisses —
        // that's the didFinishWith delegate callback under the hood.
        const { result } = await SMS.sendSMSAsync([person.phone], fullMessage);
        results.push({ person, result });
        // Continues to next person regardless of send/cancel
      }

      opts.onComplete?.(results);
      return results;
    },
    []
  );

  return { sendReminders };
}