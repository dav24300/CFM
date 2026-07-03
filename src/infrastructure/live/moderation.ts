const BAD_WORDS = [
  "merde",
  "putain",
  "connard",
  "salope",
  "nique",
  "fdp",
  "encul",
  "batard",
  "stupid",
  "idiot",
];

export function containsBadWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w));
}

export function sanitizeChatContent(text: string): string {
  return text.trim().slice(0, 500);
}
