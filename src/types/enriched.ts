import type { Leistungsnachweis, Medikamentenplan, Pflegedurchfuehrung, Pflegeplanung, Tourenplanung, VitalwerteErfassung, Wunddokumentation } from './app';

export type EnrichedMedikamentenplan = Medikamentenplan & {
  klientName: string;
};

export type EnrichedWunddokumentation = Wunddokumentation & {
  klientName: string;
};

export type EnrichedVitalwerteErfassung = VitalwerteErfassung & {
  klientName: string;
};

export type EnrichedTourenplanung = Tourenplanung & {
  zugeordnete_pflegekraefteName: string;
  klientenName: string;
};

export type EnrichedPflegeplanung = Pflegeplanung & {
  klientName: string;
  erstellende_pflegekraftName: string;
};

export type EnrichedLeistungsnachweis = Leistungsnachweis & {
  klientName: string;
};

export type EnrichedPflegedurchfuehrung = Pflegedurchfuehrung & {
  klientName: string;
  tourName: string;
  durchfuehrende_pflegekraftName: string;
};
