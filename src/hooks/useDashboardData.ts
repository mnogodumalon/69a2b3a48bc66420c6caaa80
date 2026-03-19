import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Medikamentenplan, Klientenstammdaten, Wunddokumentation, VitalwerteErfassung, Tourenplanung, Pflegeplanung, Leistungsnachweis, Pflegedurchfuehrung, Pflegefachkraefte } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';

export function useDashboardData() {
  const [medikamentenplan, setMedikamentenplan] = useState<Medikamentenplan[]>([]);
  const [klientenstammdaten, setKlientenstammdaten] = useState<Klientenstammdaten[]>([]);
  const [wunddokumentation, setWunddokumentation] = useState<Wunddokumentation[]>([]);
  const [vitalwerteErfassung, setVitalwerteErfassung] = useState<VitalwerteErfassung[]>([]);
  const [tourenplanung, setTourenplanung] = useState<Tourenplanung[]>([]);
  const [pflegeplanung, setPflegeplanung] = useState<Pflegeplanung[]>([]);
  const [leistungsnachweis, setLeistungsnachweis] = useState<Leistungsnachweis[]>([]);
  const [pflegedurchfuehrung, setPflegedurchfuehrung] = useState<Pflegedurchfuehrung[]>([]);
  const [pflegefachkraefte, setPflegefachkraefte] = useState<Pflegefachkraefte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [medikamentenplanData, klientenstammdatenData, wunddokumentationData, vitalwerteErfassungData, tourenplanungData, pflegeplanungData, leistungsnachweisData, pflegedurchfuehrungData, pflegefachkraefteData] = await Promise.all([
        LivingAppsService.getMedikamentenplan(),
        LivingAppsService.getKlientenstammdaten(),
        LivingAppsService.getWunddokumentation(),
        LivingAppsService.getVitalwerteErfassung(),
        LivingAppsService.getTourenplanung(),
        LivingAppsService.getPflegeplanung(),
        LivingAppsService.getLeistungsnachweis(),
        LivingAppsService.getPflegedurchfuehrung(),
        LivingAppsService.getPflegefachkraefte(),
      ]);
      setMedikamentenplan(medikamentenplanData);
      setKlientenstammdaten(klientenstammdatenData);
      setWunddokumentation(wunddokumentationData);
      setVitalwerteErfassung(vitalwerteErfassungData);
      setTourenplanung(tourenplanungData);
      setPflegeplanung(pflegeplanungData);
      setLeistungsnachweis(leistungsnachweisData);
      setPflegedurchfuehrung(pflegedurchfuehrungData);
      setPflegefachkraefte(pflegefachkraefteData);
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

  const tourenplanungMap = useMemo(() => {
    const m = new Map<string, Tourenplanung>();
    tourenplanung.forEach(r => m.set(r.record_id, r));
    return m;
  }, [tourenplanung]);

  const pflegefachkraefteMap = useMemo(() => {
    const m = new Map<string, Pflegefachkraefte>();
    pflegefachkraefte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [pflegefachkraefte]);

  return { medikamentenplan, setMedikamentenplan, klientenstammdaten, setKlientenstammdaten, wunddokumentation, setWunddokumentation, vitalwerteErfassung, setVitalwerteErfassung, tourenplanung, setTourenplanung, pflegeplanung, setPflegeplanung, leistungsnachweis, setLeistungsnachweis, pflegedurchfuehrung, setPflegedurchfuehrung, pflegefachkraefte, setPflegefachkraefte, loading, error, fetchAll, klientenstammdatenMap, tourenplanungMap, pflegefachkraefteMap };
}