import { useState, useMemo } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichMedikamentenplan, enrichPflegeplanung, enrichTourenplanung, enrichVitalwerteErfassung, enrichWunddokumentation, enrichPflegedurchfuehrung, enrichLeistungsnachweis } from '@/lib/enrich';
import type { Klientenstammdaten, Pflegefachkraefte, Tourenplanung, VitalwerteErfassung, Wunddokumentation, Pflegedurchfuehrung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate, displayLookup, displayMultiLookup } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { KlientenstammdatenDialog } from '@/components/dialogs/KlientenstammdatenDialog';
import { VitalwerteErfassungDialog } from '@/components/dialogs/VitalwerteErfassungDialog';
import { PflegedurchfuehrungDialog } from '@/components/dialogs/PflegedurchfuehrungDialog';
import { TourenplanungDialog } from '@/components/dialogs/TourenplanungDialog';
import { WunddokumentationDialog } from '@/components/dialogs/WunddokumentationDialog';
import {
  Users, Heart, Route, AlertTriangle, Plus, ChevronRight, Activity,
  Pill, ClipboardList, Clock, MapPin, Phone, Calendar, AlertCircle,
  Pencil, Trash2, Eye, Stethoscope, Wind, Thermometer, Scale
} from 'lucide-react';

export default function DashboardOverview() {
  const {
    klientenstammdaten, pflegefachkraefte, medikamentenplan, pflegeplanung,
    tourenplanung, vitalwerteErfassung, wunddokumentation, pflegedurchfuehrung, leistungsnachweis,
    klientenstammdatenMap, pflegefachkraefteMap, tourenplanungMap,
    loading, error, fetchAll,
  } = useDashboardData();

  // UI state — all hooks BEFORE early returns
  const [selectedKlientId, setSelectedKlientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'vitals' | 'meds' | 'wounds' | 'visits'>('vitals');

  // Dialog state
  const [klientDialog, setKlientDialog] = useState(false);
  const [editKlient, setEditKlient] = useState<Klientenstammdaten | null>(null);
  const [deleteKlientTarget, setDeleteKlientTarget] = useState<Klientenstammdaten | null>(null);

  const [vitalDialog, setVitalDialog] = useState(false);
  const [editVital, setEditVital] = useState<VitalwerteErfassung | null>(null);

  const [pflegeDialog, setPflegeDialog] = useState(false);
  const [editPflege, setEditPflege] = useState<Pflegedurchfuehrung | null>(null);

  const [tourDialog, setTourDialog] = useState(false);
  const [editTour, setEditTour] = useState<Tourenplanung | null>(null);
  const [deleteTourTarget, setDeleteTourTarget] = useState<Tourenplanung | null>(null);

  const [wundDialog, setWundDialog] = useState(false);
  const [editWund, setEditWund] = useState<Wunddokumentation | null>(null);

  // Enrich
  const enrichedMedikamentenplan = enrichMedikamentenplan(medikamentenplan, { klientenstammdatenMap });
  const enrichedPflegeplanung = enrichPflegeplanung(pflegeplanung, { klientenstammdatenMap, pflegefachkraefteMap });
  const enrichedTourenplanung = enrichTourenplanung(tourenplanung, { pflegefachkraefteMap, klientenstammdatenMap });
  const enrichedVitalwerteErfassung = enrichVitalwerteErfassung(vitalwerteErfassung, { klientenstammdatenMap });
  const enrichedWunddokumentation = enrichWunddokumentation(wunddokumentation, { klientenstammdatenMap });
  const enrichedPflegedurchfuehrung = enrichPflegedurchfuehrung(pflegedurchfuehrung, { klientenstammdatenMap, tourenplanungMap, pflegefachkraefteMap });
  const enrichedLeistungsnachweis = enrichLeistungsnachweis(leistungsnachweis, { klientenstammdatenMap });

  // Today's tours
  const today = new Date().toISOString().slice(0, 10);
  const todaysTours = useMemo(
    () => enrichedTourenplanung.filter(t => t.fields.tourdatum === today),
    [enrichedTourenplanung, today]
  );

  // Selected client
  const selectedKlient = selectedKlientId
    ? klientenstammdaten.find(k => k.record_id === selectedKlientId) ?? null
    : null;

  // Per-client filtered data
  const klientVitals = useMemo(
    () => selectedKlientId
      ? enrichedVitalwerteErfassung
          .filter(v => extractRecordId(v.fields.klient) === selectedKlientId)
          .sort((a, b) => (b.fields.messzeitpunkt ?? '').localeCompare(a.fields.messzeitpunkt ?? ''))
          .slice(0, 5)
      : [],
    [enrichedVitalwerteErfassung, selectedKlientId]
  );

  const klientMeds = useMemo(
    () => selectedKlientId
      ? enrichedMedikamentenplan.filter(m => extractRecordId(m.fields.klient) === selectedKlientId)
      : [],
    [enrichedMedikamentenplan, selectedKlientId]
  );

  const klientWunden = useMemo(
    () => selectedKlientId
      ? enrichedWunddokumentation.filter(w => extractRecordId(w.fields.klient) === selectedKlientId)
      : [],
    [enrichedWunddokumentation, selectedKlientId]
  );

  const klientVisits = useMemo(
    () => selectedKlientId
      ? enrichedPflegedurchfuehrung
          .filter(p => extractRecordId(p.fields.klient) === selectedKlientId)
          .sort((a, b) => (b.fields.besuchsdatum ?? '').localeCompare(a.fields.besuchsdatum ?? ''))
          .slice(0, 5)
      : [],
    [enrichedPflegedurchfuehrung, selectedKlientId]
  );

  // KPIs
  const activeClients = klientenstammdaten.length;
  const activePflegekraefte = pflegefachkraefte.filter(p => p.fields.aktiv).length;
  const pendingWunden = wunddokumentation.length;
  const notfallTouren = tourenplanung.filter(t => t.fields.notfaelle).length;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  const pflegegradColor = (grad: string | undefined) => {
    const map: Record<string, string> = {
      pflegegrad_1: 'bg-emerald-100 text-emerald-700',
      pflegegrad_2: 'bg-yellow-100 text-yellow-700',
      pflegegrad_3: 'bg-orange-100 text-orange-700',
      pflegegrad_4: 'bg-red-100 text-red-700',
      pflegegrad_5: 'bg-purple-100 text-purple-700',
    };
    return map[grad ?? ''] ?? 'bg-muted text-muted-foreground';
  };

  const pflegegradLabel = (grad: string | undefined) => {
    const map: Record<string, string> = {
      pflegegrad_1: 'PG 1', pflegegrad_2: 'PG 2', pflegegrad_3: 'PG 3',
      pflegegrad_4: 'PG 4', pflegegrad_5: 'PG 5',
    };
    return map[grad ?? ''] ?? '—';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pflegedashboard</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Button
          size="sm"
          onClick={() => { setEditKlient(null); setKlientDialog(true); }}
          className="gap-1.5"
        >
          <Plus size={15} />
          Klient anlegen
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Klienten"
          value={String(activeClients)}
          description="Aktiv betreut"
          icon={<Users size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Pflegekräfte"
          value={String(activePflegekraefte)}
          description="Im Dienst aktiv"
          icon={<Heart size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Wunddok."
          value={String(pendingWunden)}
          description="Dokumentationen"
          icon={<Activity size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Notfall-Touren"
          value={String(notfallTouren)}
          description="Markiert"
          icon={<AlertTriangle size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Main workspace: Klient list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Klientenliste */}
        <div className="lg:col-span-1 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">Klienten</h2>
            <span className="text-xs text-muted-foreground">{klientenstammdaten.length} gesamt</span>
          </div>
          {klientenstammdaten.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
              Noch keine Klienten angelegt
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {klientenstammdaten.map(k => (
                <button
                  key={k.record_id}
                  onClick={() => setSelectedKlientId(k.record_id === selectedKlientId ? null : k.record_id)}
                  className={`w-full text-left rounded-2xl border p-3 transition-all ${
                    selectedKlientId === k.record_id
                      ? 'bg-primary/5 border-primary/30 shadow-sm'
                      : 'bg-card border-border hover:border-primary/20 hover:bg-accent/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {k.fields.vorname} {k.fields.nachname}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {k.fields.stadt ?? '—'}{k.fields.telefon ? ` · ${k.fields.telefon}` : ''}
                      </p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${pflegegradColor(k.fields.pflegegrad)}`}>
                      {pflegegradLabel(k.fields.pflegegrad)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Detail panel or Today's tours */}
        <div className="lg:col-span-2 space-y-4">
          {selectedKlient ? (
            /* === Client Detail Panel === */
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Client header */}
              <div className="px-5 py-4 border-b border-border bg-muted/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg font-bold text-foreground">
                        {selectedKlient.fields.vorname} {selectedKlient.fields.nachname}
                      </h2>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pflegegradColor(selectedKlient.fields.pflegegrad)}`}>
                        {pflegegradLabel(selectedKlient.fields.pflegegrad)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {selectedKlient.fields.geburtsdatum && (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {formatDate(selectedKlient.fields.geburtsdatum)}
                        </span>
                      )}
                      {selectedKlient.fields.stadt && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {selectedKlient.fields.strasse} {selectedKlient.fields.hausnummer}, {selectedKlient.fields.postleitzahl} {selectedKlient.fields.stadt}
                        </span>
                      )}
                      {selectedKlient.fields.telefon && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} />
                          {selectedKlient.fields.telefon}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditKlient(selectedKlient); setKlientDialog(true); }}
                      className="h-8 px-2.5"
                    >
                      <Pencil size={13} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteKlientTarget(selectedKlient)}
                      className="h-8 px-2.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
                {selectedKlient.fields.krankenversicherung && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    KV: {selectedKlient.fields.krankenversicherung}
                    {selectedKlient.fields.versichertennummer ? ` · Nr. ${selectedKlient.fields.versichertennummer}` : ''}
                    {selectedKlient.fields.kostentraeger ? ` · Kostenträger: ${selectedKlient.fields.kostentraeger}` : ''}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-4">
                {([
                  { key: 'vitals', label: 'Vitalwerte', icon: <Activity size={13} /> },
                  { key: 'meds', label: 'Medikamente', icon: <Pill size={13} /> },
                  { key: 'wounds', label: 'Wunden', icon: <Stethoscope size={13} /> },
                  { key: 'visits', label: 'Besuche', icon: <ClipboardList size={13} /> },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 transition-colors -mb-px ${
                      activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className="ml-0.5 text-[10px] tabular-nums">
                      {tab.key === 'vitals' ? klientVitals.length
                        : tab.key === 'meds' ? klientMeds.length
                        : tab.key === 'wounds' ? klientWunden.length
                        : klientVisits.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="p-4">
                {activeTab === 'vitals' && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium text-muted-foreground">Letzte Messungen</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => { setEditVital(null); setVitalDialog(true); }}
                      >
                        <Plus size={11} /> Messen
                      </Button>
                    </div>
                    {klientVitals.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">Keine Vitalwerte vorhanden</p>
                    ) : (
                      klientVitals.map(v => (
                        <div key={v.record_id} className="rounded-xl border border-border p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-medium text-foreground flex items-center gap-1">
                              <Clock size={11} className="text-muted-foreground" />
                              {formatDate(v.fields.messzeitpunkt ?? '')}
                            </span>
                            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => { setEditVital(v); setVitalDialog(true); }}>
                              <Pencil size={11} />
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {v.fields.blutdruck_systolisch != null && v.fields.blutdruck_diastolisch != null && (
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5 mb-1">
                                  <Heart size={10} /> RR
                                </p>
                                <p className="text-sm font-bold tabular-nums">{v.fields.blutdruck_systolisch}/{v.fields.blutdruck_diastolisch}</p>
                                <p className="text-[10px] text-muted-foreground">mmHg</p>
                              </div>
                            )}
                            {v.fields.puls != null && (
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5 mb-1">
                                  <Activity size={10} /> Puls
                                </p>
                                <p className="text-sm font-bold tabular-nums">{v.fields.puls}</p>
                                <p className="text-[10px] text-muted-foreground">bpm</p>
                              </div>
                            )}
                            {v.fields.temperatur != null && (
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5 mb-1">
                                  <Thermometer size={10} /> Temp
                                </p>
                                <p className="text-sm font-bold tabular-nums">{v.fields.temperatur}</p>
                                <p className="text-[10px] text-muted-foreground">°C</p>
                              </div>
                            )}
                            {v.fields.sauerstoffsaettigung != null && (
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5 mb-1">
                                  <Wind size={10} /> SpO2
                                </p>
                                <p className="text-sm font-bold tabular-nums">{v.fields.sauerstoffsaettigung}</p>
                                <p className="text-[10px] text-muted-foreground">%</p>
                              </div>
                            )}
                            {v.fields.gewicht != null && (
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5 mb-1">
                                  <Scale size={10} /> KG
                                </p>
                                <p className="text-sm font-bold tabular-nums">{v.fields.gewicht}</p>
                                <p className="text-[10px] text-muted-foreground">kg</p>
                              </div>
                            )}
                            {v.fields.blutzucker != null && (
                              <div className="text-center p-2 rounded-lg bg-muted/50">
                                <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5 mb-1">
                                  <Activity size={10} /> BZ
                                </p>
                                <p className="text-sm font-bold tabular-nums">{v.fields.blutzucker}</p>
                                <p className="text-[10px] text-muted-foreground">mg/dl</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'meds' && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Aktive Medikamente ({klientMeds.length})</p>
                    {klientMeds.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">Kein Medikamentenplan vorhanden</p>
                    ) : (
                      klientMeds.map(m => (
                        <div key={m.record_id} className="rounded-xl border border-border p-3 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Pill size={14} className="text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground">{m.fields.medikamentenname ?? '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.fields.wirkstoff ? `${m.fields.wirkstoff} · ` : ''}
                              {displayLookup(m.fields.darreichungsform)} · {m.fields.dosierung ?? '—'}
                            </p>
                            {m.fields.einnahmezeiten && (
                              <p className="text-xs text-muted-foreground mt-0.5">{displayMultiLookup(m.fields.einnahmezeiten)}</p>
                            )}
                          </div>
                          {m.fields.verordnender_arzt && (
                            <span className="text-xs text-muted-foreground shrink-0">Dr. {m.fields.verordnender_arzt}</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'wounds' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-medium text-muted-foreground">Wunddokumentationen ({klientWunden.length})</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => { setEditWund(null); setWundDialog(true); }}
                      >
                        <Plus size={11} /> Wunde
                      </Button>
                    </div>
                    {klientWunden.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">Keine Wunden dokumentiert</p>
                    ) : (
                      klientWunden.map(w => (
                        <div key={w.record_id} className="rounded-xl border border-border p-3">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <p className="font-medium text-sm text-foreground">
                                {displayLookup(w.fields.wundtyp)} — {displayLookup(w.fields.koerperregion)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {w.fields.genaue_lokalisation ?? ''} {formatDate(w.fields.dokumentationsdatum ?? '')}
                              </p>
                            </div>
                            {w.fields.wundstadium && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                {displayLookup(w.fields.wundstadium)}
                              </span>
                            )}
                          </div>
                          {w.fields.wundzustand && (
                            <p className="text-xs text-muted-foreground">{displayMultiLookup(w.fields.wundzustand)}</p>
                          )}
                          {w.fields.naechster_verbandwechsel && (
                            <p className="text-xs text-primary mt-1 font-medium">
                              Nächster Verbandwechsel: {formatDate(w.fields.naechster_verbandwechsel)}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'visits' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-medium text-muted-foreground">Letzte Besuche</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => { setEditPflege(null); setPflegeDialog(true); }}
                      >
                        <Plus size={11} /> Besuch
                      </Button>
                    </div>
                    {klientVisits.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center">Keine Besuche dokumentiert</p>
                    ) : (
                      klientVisits.map(p => (
                        <div key={p.record_id} className="rounded-xl border border-border p-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground">
                                {formatDate(p.fields.besuchsdatum ?? '')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.durchfuehrende_pflegekraftName || '—'}
                                {p.fields.dauer_minuten ? ` · ${p.fields.dauer_minuten} min` : ''}
                              </p>
                              {p.fields.leistungsart && (
                                <p className="text-xs text-muted-foreground mt-0.5">{displayMultiLookup(p.fields.leistungsart)}</p>
                              )}
                            </div>
                            {p.fields.massnahmen_erforderlich && (
                              <span className="shrink-0 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                Maßnahmen nötig
                              </span>
                            )}
                          </div>
                          {p.fields.pflegebericht && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.fields.pflegebericht}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* === Today's Tours === */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Route size={15} />
                  Heutige Touren
                  <span className="text-xs text-muted-foreground font-normal">({todaysTours.length})</span>
                </h2>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setEditTour(null); setTourDialog(true); }}>
                  <Plus size={11} /> Tour
                </Button>
              </div>

              {todaysTours.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                  <Route size={32} className="text-muted-foreground mx-auto mb-3 opacity-30" />
                  <p className="text-sm text-muted-foreground">Heute keine Touren geplant</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => { setEditTour(null); setTourDialog(true); }}>
                    <Plus size={13} /> Tour anlegen
                  </Button>
                </div>
              ) : (
                todaysTours.map(t => (
                  <div key={t.record_id} className={`rounded-2xl border p-4 ${t.fields.notfaelle ? 'border-red-200 bg-red-50' : 'border-border bg-card'}`}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-foreground">{t.fields.tourbezeichnung ?? 'Tour'}</h3>
                          {t.fields.notfaelle && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                              <AlertTriangle size={10} /> Notfall
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.fields.startzeit ? `${t.fields.startzeit}` : ''}
                          {t.fields.endzeit ? ` — ${t.fields.endzeit}` : ''}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { setEditTour(t); setTourDialog(true); }}>
                          <Pencil size={12} />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={() => setDeleteTourTarget(t)}>
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </div>
                    {t.zugeordnete_pflegekraefteName && (
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Users size={11} />
                        {t.zugeordnete_pflegekraefteName}
                      </p>
                    )}
                    {t.fields.bemerkungen && (
                      <p className="text-xs text-muted-foreground italic">{t.fields.bemerkungen}</p>
                    )}
                  </div>
                ))
              )}

              {/* Recent visits today */}
              {enrichedPflegedurchfuehrung.filter(p =>
                p.fields.besuchsdatum?.slice(0, 10) === today
              ).length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <ClipboardList size={14} />
                    Heutige Pflegedurchführungen
                  </h3>
                  <div className="space-y-2">
                    {enrichedPflegedurchfuehrung
                      .filter(p => p.fields.besuchsdatum?.slice(0, 10) === today)
                      .map(p => (
                        <div key={p.record_id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.klientName || '—'}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.durchfuehrende_pflegekraftName || '—'}{p.fields.dauer_minuten ? ` · ${p.fields.dauer_minuten} min` : ''}
                            </p>
                          </div>
                          {p.fields.massnahmen_erforderlich && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Maßnahmen</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Anleitung */}
              <div className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                <Eye size={14} className="mx-auto mb-1 opacity-40" />
                Klient links auswählen für Detailansicht (Vitalwerte, Medikamente, Wunden, Besuche)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All-clients overview: upcoming wound changes */}
      {wunddokumentation.filter(w => w.fields.naechster_verbandwechsel).length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Stethoscope size={14} />
            Anstehende Verbandwechsel
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {enrichedWunddokumentation
              .filter(w => w.fields.naechster_verbandwechsel)
              .sort((a, b) => (a.fields.naechster_verbandwechsel ?? '').localeCompare(b.fields.naechster_verbandwechsel ?? ''))
              .slice(0, 6)
              .map(w => {
                const isOverdue = (w.fields.naechster_verbandwechsel ?? '') < today;
                const isToday = w.fields.naechster_verbandwechsel === today;
                return (
                  <div key={w.record_id} className={`rounded-xl border p-3 ${isOverdue ? 'border-red-200 bg-red-50' : isToday ? 'border-orange-200 bg-orange-50' : 'border-border'}`}>
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm text-foreground">{w.klientName || '—'}</p>
                      {isOverdue && <span className="text-xs text-red-600 font-medium">Überfällig</span>}
                      {isToday && !isOverdue && <span className="text-xs text-orange-600 font-medium">Heute</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{displayLookup(w.fields.wundtyp)} — {displayLookup(w.fields.koerperregion)}</p>
                    <p className="text-xs font-medium text-foreground mt-1">{formatDate(w.fields.naechster_verbandwechsel ?? '')}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* =============== Dialogs =============== */}

      <KlientenstammdatenDialog
        open={klientDialog}
        onClose={() => { setKlientDialog(false); setEditKlient(null); }}
        onSubmit={async (fields) => {
          if (editKlient) {
            await LivingAppsService.updateKlientenstammdatenEntry(editKlient.record_id, fields);
          } else {
            await LivingAppsService.createKlientenstammdatenEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editKlient?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Klientenstammdaten']}
      />

      <ConfirmDialog
        open={!!deleteKlientTarget}
        title="Klient löschen"
        description={`${deleteKlientTarget?.fields.vorname} ${deleteKlientTarget?.fields.nachname} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        onConfirm={async () => {
          if (deleteKlientTarget) {
            await LivingAppsService.deleteKlientenstammdatenEntry(deleteKlientTarget.record_id);
            if (selectedKlientId === deleteKlientTarget.record_id) setSelectedKlientId(null);
            setDeleteKlientTarget(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteKlientTarget(null)}
      />

      <VitalwerteErfassungDialog
        open={vitalDialog}
        onClose={() => { setVitalDialog(false); setEditVital(null); }}
        onSubmit={async (fields) => {
          if (editVital) {
            await LivingAppsService.updateVitalwerteErfassungEntry(editVital.record_id, fields);
          } else {
            const klientUrl = selectedKlientId
              ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId)
              : undefined;
            await LivingAppsService.createVitalwerteErfassungEntry({ ...fields, klient: klientUrl });
          }
          fetchAll();
        }}
        defaultValues={
          editVital
            ? editVital.fields
            : selectedKlientId
            ? { klient: createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) }
            : undefined
        }
        klientenstammdatenList={klientenstammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['VitalwerteErfassung']}
      />

      <PflegedurchfuehrungDialog
        open={pflegeDialog}
        onClose={() => { setPflegeDialog(false); setEditPflege(null); }}
        onSubmit={async (fields) => {
          if (editPflege) {
            await LivingAppsService.updatePflegedurchfuehrungEntry(editPflege.record_id, fields);
          } else {
            const klientUrl = selectedKlientId
              ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId)
              : undefined;
            await LivingAppsService.createPflegedurchfuehrungEntry({ ...fields, klient: klientUrl });
          }
          fetchAll();
        }}
        defaultValues={
          editPflege
            ? editPflege.fields
            : selectedKlientId
            ? { klient: createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) }
            : undefined
        }
        klientenstammdatenList={klientenstammdaten}
        tourenplanungList={tourenplanung}
        pflegefachkraefteList={pflegefachkraefte}
        enablePhotoScan={AI_PHOTO_SCAN['Pflegedurchfuehrung']}
      />

      <TourenplanungDialog
        open={tourDialog}
        onClose={() => { setTourDialog(false); setEditTour(null); }}
        onSubmit={async (fields) => {
          if (editTour) {
            await LivingAppsService.updateTourenplanungEntry(editTour.record_id, fields);
          } else {
            await LivingAppsService.createTourenplanungEntry(fields);
          }
          fetchAll();
        }}
        defaultValues={editTour?.fields}
        pflegefachkraefteList={pflegefachkraefte}
        klientenstammdatenList={klientenstammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['Tourenplanung']}
      />

      <ConfirmDialog
        open={!!deleteTourTarget}
        title="Tour löschen"
        description={`Tour "${deleteTourTarget?.fields.tourbezeichnung ?? ''}" wirklich löschen?`}
        onConfirm={async () => {
          if (deleteTourTarget) {
            await LivingAppsService.deleteTourenplanungEntry(deleteTourTarget.record_id);
            setDeleteTourTarget(null);
            fetchAll();
          }
        }}
        onClose={() => setDeleteTourTarget(null)}
      />

      <WunddokumentationDialog
        open={wundDialog}
        onClose={() => { setWundDialog(false); setEditWund(null); }}
        onSubmit={async (fields) => {
          if (editWund) {
            await LivingAppsService.updateWunddokumentationEntry(editWund.record_id, fields);
          } else {
            const klientUrl = selectedKlientId
              ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId)
              : undefined;
            await LivingAppsService.createWunddokumentationEntry({ ...fields, klient: klientUrl });
          }
          fetchAll();
        }}
        defaultValues={
          editWund
            ? editWund.fields
            : selectedKlientId
            ? { klient: createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) }
            : undefined
        }
        klientenstammdatenList={klientenstammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['Wunddokumentation']}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-[500px] rounded-2xl" />
        <Skeleton className="h-[500px] rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
