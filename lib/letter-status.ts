export type LetterStatus = "scheduled" | "delivered" | "read" | "canceled";

export function canTransition(from: LetterStatus, to: LetterStatus): boolean {
  if (from === to) {
    return true;
  }

  const transitions: Record<LetterStatus, LetterStatus[]> = {
    scheduled: ["delivered", "canceled"],
    delivered: ["read"],
    read: [],
    canceled: []
  };

  return transitions[from].includes(to);
}
