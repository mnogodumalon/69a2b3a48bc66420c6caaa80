/**
 * AI feature toggles per entity.
 * Set to true to show "Foto scannen" button in the create/edit dialog.
 * The agent can change these values — all other AI files are pre-generated.
 */

export const AI_PHOTO_SCAN: Record<string, boolean> = {
  Klientenstammdaten: true,
  Pflegefachkraefte: true,
  Medikamentenplan: true,
  Pflegeplanung: true,
  Tourenplanung: true,
  VitalwerteErfassung: true,
  Wunddokumentation: true,
  Pflegedurchfuehrung: true,
  Leistungsnachweis: true,
};