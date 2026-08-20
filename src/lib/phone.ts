export type CountryCode = { code: string; label: string; flag: string };

/** Common country dial codes for student users. */
export const COUNTRY_CODES: CountryCode[] = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+1", label: "USA / Canada", flag: "🇺🇸" },
  { code: "+44", label: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
  { code: "+65", label: "Singapore", flag: "🇸🇬" },
  { code: "+49", label: "Germany", flag: "🇩🇪" },
  { code: "+33", label: "France", flag: "🇫🇷" },
  { code: "+81", label: "Japan", flag: "🇯🇵" },
  { code: "+86", label: "China", flag: "🇨🇳" },
  { code: "+92", label: "Pakistan", flag: "🇵🇰" },
  { code: "+880", label: "Bangladesh", flag: "🇧🇩" },
  { code: "+977", label: "Nepal", flag: "🇳🇵" },
  { code: "+94", label: "Sri Lanka", flag: "🇱🇰" },
  { code: "+234", label: "Nigeria", flag: "🇳🇬" },
  { code: "+27", label: "South Africa", flag: "🇿🇦" },
  { code: "+55", label: "Brazil", flag: "🇧🇷" },
  { code: "+60", label: "Malaysia", flag: "🇲🇾" },
];

export const DEFAULT_COUNTRY_CODE = "+91";

/** Splits a stored phone value such as "+91 98765 43210" into dial code + local digits. */
export function splitPhone(value: string | null | undefined): {
  countryCode: string;
  number: string;
} {
  const raw = (value ?? "").replace(/[^\d+]/g, "");
  if (!raw) return { countryCode: DEFAULT_COUNTRY_CODE, number: "" };
  if (raw.startsWith("+")) {
    const match = [...COUNTRY_CODES]
      .sort((a, b) => b.code.length - a.code.length)
      .find((entry) => raw.startsWith(entry.code));
    if (match) {
      return { countryCode: match.code, number: raw.slice(match.code.length) };
    }
    return { countryCode: DEFAULT_COUNTRY_CODE, number: raw.replace(/^\+/, "") };
  }
  return { countryCode: DEFAULT_COUNTRY_CODE, number: raw };
}

/** Builds the stored E.164-style value from a dial code and local number. */
export function joinPhone(countryCode: string, number: string): string {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";
  return `${countryCode}${digits}`;
}

/** Returns an error message for an invalid local number, or null when valid. */
export function validateLocalNumber(number: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length < 6) return "Mobile number looks too short";
  if (digits.length > 14) return "Mobile number looks too long";
  if (/^0+$/.test(digits)) return "Enter a real mobile number";
  return null;
}

export function formatPhoneForDisplay(value: string): string {
  const { countryCode, number } = splitPhone(value);
  return number ? `${countryCode} ${number}` : value;
}
