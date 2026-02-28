import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Klientenstammdaten, Pflegefachkraefte, Medikamentenplan, Pflegeplanung, Tourenplanung, VitalwerteErfassung, Wunddokumentation, Pflegedurchfuehrung, Leistungsnachweis } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [klientenstammdaten, setKlientenstammdaten] = useState<Klientenstammdaten[]>([]);
  const [pflegefachkraefte, setPflegefachkraefte] = useState<Pflegefachkraefte[]>([]);
  const [medikamentenplan, setMedikamentenplan] = useState<Medikamentenplan[]>([]);
  const [pflegeplanung, setPflegeplanung] = useState<Pflegeplanung[]>([]);
  const [tourenplanung, setTourenplanung] = useState<Tourenplanung[]>([]);
  const [vitalwerteErfassung, setVitalwerteErfassung] = useState<VitalwerteErfassung[]>([]);
  const [wunddokumentation, setWunddokumentation] = useState<Wunddokumentation[]>([]);
  const [pflegedurchfuehrung, setPflegedurchfuehrung] = useState<Pflegedurchfuehrung[]>([]);
  const [leistungsnachweis, setLeistungsnachweis] = useState<Leistungsnachweis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [klientenstammdatenData, pflegefachkraefteData, medikamentenplanData, pflegeplanungData, tourenplanungData, vitalwerteErfassungData, wunddokumentationData, pflegedurchfuehrungData, leistungsnachweisData] = await Promise.all([
        LivingAppsService.getKlientenstammdaten(),
        LivingAppsService.getPflegefachkraefte(),
        LivingAppsService.getMedikamentenplan(),
        LivingAppsService.getPflegeplanung(),
        LivingAppsService.getTourenplanung(),
        LivingAppsService.getVitalwerteErfassung(),
        LivingAppsService.getWunddokumentation(),
        LivingAppsService.getPflegedurchfuehrung(),
        LivingAppsService.getLeistungsnachweis(),
      ]);
      setKlientenstammdaten(klientenstammdatenData);
      setPflegefachkraefte(pflegefachkraefteData);
      setMedikamentenplan(medikamentenplanData);
      setPflegeplanung(pflegeplanungData);
      setTourenplanung(tourenplanungData);
      setVitalwerteErfassung(vitalwerteErfassungData);
      setWunddokumentation(wunddokumentationData);
      setPflegedurchfuehrung(pflegedurchfuehrungData);
      setLeistungsnachweis(leistungsnachweisData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const klientenstammdatenMap = useMemo(() => {
    const m = new Map<string, Klientenstammdaten>();
    klientenstammdaten.forEach(r => m.set(r.record_id, r));
    return m;
  }, [klientenstammdaten]);

  const pflegefachkraefteMap = useMemo(() => {
    const m = new Map<string, Pflegefachkraefte>();
    pflegefachkraefte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [pflegefachkraefte]);

  const tourenplanungMap = useMemo(() => {
    const m = new Map<string, Tourenplanung>();
    tourenplanung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [tourenplanung]);

  return { klientenstammdaten, setKlientenstammdaten, pflegefachkraefte, setPflegefachkraefte, medikamentenplan, setMedikamentenplan, pflegeplanung, setPflegeplanung, tourenplanung, setTourenplanung, vitalwerteErfassung, setVitalwerteErfassung, wunddokumentation, setWunddokumentation, pflegedurchfuehrung, setPflegedurchfuehrung, leistungsnachweis, setLeistungsnachweis, loading, error, fetchAll, klientenstammdatenMap, pflegefachkraefteMap, tourenplanungMap };
}