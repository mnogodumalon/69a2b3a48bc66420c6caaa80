import type { EnrichedLeistungsnachweis, EnrichedMedikamentenplan, EnrichedPflegedurchfuehrung, EnrichedPflegeplanung, EnrichedTourenplanung, EnrichedVitalwerteErfassung, EnrichedWunddokumentation } from '@/types/enriched';
import type { Klientenstammdaten, Leistungsnachweis, Medikamentenplan, Pflegedurchfuehrung, Pflegefachkraefte, Pflegeplanung, Tourenplanung, VitalwerteErfassung, Wunddokumentation } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface MedikamentenplanMaps {
  klientenstammdatenMap: Map<string, Klientenstammdaten>;
}

export function enrichMedikamentenplan(
  medikamentenplan: Medikamentenplan[],
  maps: MedikamentenplanMaps
): EnrichedMedikamentenplan[] {
  return medikamentenplan.map(r => ({
    ...r,
    klientName: resolveDisplay(r.fields.klient, maps.klientenstammdatenMap, 'vorname', 'nachname'),
  }));
}

interface WunddokumentationMaps {
  klientenstammdatenMap: Map<string, Klientenstammdaten>;
}

export function enrichWunddokumentation(
  wunddokumentation: Wunddokumentation[],
  maps: WunddokumentationMaps
): EnrichedWunddokumentation[] {
  return wunddokumentation.map(r => ({
    ...r,
    klientName: resolveDisplay(r.fields.klient, maps.klientenstammdatenMap, 'vorname', 'nachname'),
  }));
}

interface VitalwerteErfassungMaps {
  klientenstammdatenMap: Map<string, Klientenstammdaten>;
}

export function enrichVitalwerteErfassung(
  vitalwerteErfassung: VitalwerteErfassung[],
  maps: VitalwerteErfassungMaps
): EnrichedVitalwerteErfassung[] {
  return vitalwerteErfassung.map(r => ({
    ...r,
    klientName: resolveDisplay(r.fields.klient, maps.klientenstammdatenMap, 'vorname', 'nachname'),
  }));
}

interface TourenplanungMaps {
  pflegefachkraefteMap: Map<string, Pflegefachkraefte>;
  klientenstammdatenMap: Map<string, Klientenstammdaten>;
}

export function enrichTourenplanung(
  tourenplanung: Tourenplanung[],
  maps: TourenplanungMaps
): EnrichedTourenplanung[] {
  return tourenplanung.map(r => ({
    ...r,
    zugeordnete_pflegekraefteName: resolveDisplay(r.fields.zugeordnete_pflegekraefte, maps.pflegefachkraefteMap, 'vorname', 'nachname'),
    klientenName: resolveDisplay(r.fields.klienten, maps.klientenstammdatenMap, 'vorname', 'nachname'),
  }));
}

interface PflegeplanungMaps {
  klientenstammdatenMap: Map<string, Klientenstammdaten>;
  pflegefachkraefteMap: Map<string, Pflegefachkraefte>;
}

export function enrichPflegeplanung(
  pflegeplanung: Pflegeplanung[],
  maps: PflegeplanungMaps
): EnrichedPflegeplanung[] {
  return pflegeplanung.map(r => ({
    ...r,
    klientName: resolveDisplay(r.fields.klient, maps.klientenstammdatenMap, 'vorname', 'nachname'),
    erstellende_pflegekraftName: resolveDisplay(r.fields.erstellende_pflegekraft, maps.pflegefachkraefteMap, 'vorname', 'nachname'),
  }));
}

interface LeistungsnachweisMaps {
  klientenstammdatenMap: Map<string, Klientenstammdaten>;
}

export function enrichLeistungsnachweis(
  leistungsnachweis: Leistungsnachweis[],
  maps: LeistungsnachweisMaps
): EnrichedLeistungsnachweis[] {
  return leistungsnachweis.map(r => ({
    ...r,
    klientName: resolveDisplay(r.fields.klient, maps.klientenstammdatenMap, 'vorname', 'nachname'),
  }));
}

interface PflegedurchfuehrungMaps {
  klientenstammdatenMap: Map<string, Klientenstammdaten>;
  tourenplanungMap: Map<string, Tourenplanung>;
  pflegefachkraefteMap: Map<string, Pflegefachkraefte>;
}

export function enrichPflegedurchfuehrung(
  pflegedurchfuehrung: Pflegedurchfuehrung[],
  maps: PflegedurchfuehrungMaps
): EnrichedPflegedurchfuehrung[] {
  return pflegedurchfuehrung.map(r => ({
    ...r,
    klientName: resolveDisplay(r.fields.klient, maps.klientenstammdatenMap, 'vorname', 'nachname'),
    tourName: resolveDisplay(r.fields.tour, maps.tourenplanungMap, 'tourbezeichnung'),
    durchfuehrende_pflegekraftName: resolveDisplay(r.fields.durchfuehrende_pflegekraft, maps.pflegefachkraefteMap, 'vorname', 'nachname'),
  }));
}
