export type ConfirmationCardLike = {
  title: string;
  badge: string;
  priority?: string;
  meaning: string;
  evidence: string;
  nextCheck: string;
};

export function dedupeConfirmationCards<T extends ConfirmationCardLike>(
  cards: T[],
  getPreferenceScore: (card: T) => number,
): T[] {
  const cardMap = new Map<string, T>();

  for (const card of cards) {
    const key = `${card.badge}-${normalizeConfirmationTitle(card.title)}`;
    const existing = cardMap.get(key);

    if (!existing || getConfirmationCardPreference(card, getPreferenceScore) > getConfirmationCardPreference(existing, getPreferenceScore)) {
      cardMap.set(key, card);
    }
  }

  return Array.from(cardMap.values());
}

export function normalizeConfirmationTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

function getConfirmationCardPreference<T extends ConfirmationCardLike>(
  card: T,
  getPreferenceScore: (card: T) => number,
): number {
  return getPreferenceScore(card) * 1000 + getConfirmationCardRichness(card);
}

function getConfirmationCardRichness(card: ConfirmationCardLike): number {
  return card.meaning.length + card.evidence.length + card.nextCheck.length;
}
