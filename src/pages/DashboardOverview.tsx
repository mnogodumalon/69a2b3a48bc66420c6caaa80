import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichMedikamentenplan, enrichWunddokumentation, enrichVitalwerteErfassung, enrichTourenplanung, enrichPflegeplanung, enrichLeistungsnachweis, enrichPflegedurchfuehrung } from '@/lib/enrich';
import type { EnrichedMedikamentenplan, EnrichedWunddokumentation, EnrichedVitalwerteErfassung, EnrichedPflegeplanung, EnrichedPflegedurchfuehrung } from '@/types/enriched';
import type { Klientenstammdaten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Users, Heart, Activity, Pill, Bandage, ClipboardList, Plus, ChevronRight, Phone, User, AlertTriangle, Calendar, Clock, Pencil, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { MedikamentenplanDialog } from '@/components/dialogs/MedikamentenplanDialog';
import { WunddokumentationDialog } from '@/components/dialogs/WunddokumentationDialog';
import { VitalwerteErfassungDialog } from '@/components/dialogs/VitalwerteErfassungDialog';
import { PflegeplanungDialog } from '@/components/dialogs/PflegeplanungDialog';
import { PflegedurchfuehrungDialog } from '@/components/dialogs/PflegedurchfuehrungDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

type ActiveTab = 'vitals' | 'wunden' | 'medikamente' | 'pflegeplanung' | 'durchfuehrung';

export default function DashboardOverview() {
  const {
    medikamentenplan, klientenstammdaten, wunddokumentation, vitalwerteErfassung, tourenplanung, pflegeplanung, leistungsnachweis, pflegedurchfuehrung, pflegefachkraefte,
    klientenstammdatenMap, tourenplanungMap, pflegefachkraefteMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedMedikamentenplan = enrichMedikamentenplan(medikamentenplan, { klientenstammdatenMap });
  const enrichedWunddokumentation = enrichWunddokumentation(wunddokumentation, { klientenstammdatenMap });
  const enrichedVitalwerteErfassung = enrichVitalwerteErfassung(vitalwerteErfassung, { klientenstammdatenMap });
  const enrichedTourenplanung = enrichTourenplanung(tourenplanung, { pflegefachkraefteMap, klientenstammdatenMap });
  const enrichedPflegeplanung = enrichPflegeplanung(pflegeplanung, { klientenstammdatenMap, pflegefachkraefteMap });
  const enrichedLeistungsnachweis = enrichLeistungsnachweis(leistungsnachweis, { klientenstammdatenMap });
  const enrichedPflegedurchfuehrung = enrichPflegedurchfuehrung(pflegedurchfuehrung, { klientenstammdatenMap, tourenplanungMap, pflegefachkraefteMap });

  const [selectedKlientId, setSelectedKlientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('vitals');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [medDialog, setMedDialog] = useState(false);
  const [medEdit, setMedEdit] = useState<EnrichedMedikamentenplan | null>(null);
  const [wundDialog, setWundDialog] = useState(false);
  const [wundEdit, setWundEdit] = useState<EnrichedWunddokumentation | null>(null);
  const [vitalDialog, setVitalDialog] = useState(false);
  const [vitalEdit, setVitalEdit] = useState<EnrichedVitalwerteErfassung | null>(null);
  const [pflegeplanDialog, setPflegeplanDialog] = useState(false);
  const [pflegeplanEdit, setPflegeplanEdit] = useState<EnrichedPflegeplanung | null>(null);
  const [durchfuehrungDialog, setDurchfuehrungDialog] = useState(false);
  const [durchfuehrungEdit, setDurchfuehrungEdit] = useState<EnrichedPflegedurchfuehrung | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  const filteredKlienten = useMemo(() => {
    if (!searchQuery.trim()) return klientenstammdaten;
    const q = searchQuery.toLowerCase();
    return klientenstammdaten.filter(k =>
      `${k.fields.vorname} ${k.fields.nachname}`.toLowerCase().includes(q) ||
      k.fields.stadt?.toLowerCase().includes(q)
    );
  }, [klientenstammdaten, searchQuery]);

  const selectedKlient = useMemo(
    () => klientenstammdaten.find(k => k.record_id === selectedKlientId) ?? null,
    [klientenstammdaten, selectedKlientId]
  );

  // Per-client filtered data
  const clientVitals = useMemo(() =>
    enrichedVitalwerteErfassung.filter(v => extractRecordId(v.fields.klient) === selectedKlientId)
      .sort((a, b) => (b.fields.messzeitpunkt ?? '').localeCompare(a.fields.messzeitpunkt ?? '')),
    [enrichedVitalwerteErfassung, selectedKlientId]
  );
  const clientWunden = useMemo(() =>
    enrichedWunddokumentation.filter(w => extractRecordId(w.fields.klient) === selectedKlientId)
      .sort((a, b) => (b.fields.dokumentationsdatum ?? '').localeCompare(a.fields.dokumentationsdatum ?? '')),
    [enrichedWunddokumentation, selectedKlientId]
  );
  const clientMedikamente = useMemo(() =>
    enrichedMedikamentenplan.filter(m => extractRecordId(m.fields.klient) === selectedKlientId),
    [enrichedMedikamentenplan, selectedKlientId]
  );
  const clientPflegeplanung = useMemo(() =>
    enrichedPflegeplanung.filter(p => extractRecordId(p.fields.klient) === selectedKlientId)
      .sort((a, b) => (b.fields.erstellungsdatum ?? '').localeCompare(a.fields.erstellungsdatum ?? '')),
    [enrichedPflegeplanung, selectedKlientId]
  );
  const clientDurchfuehrung = useMemo(() =>
    enrichedPflegedurchfuehrung.filter(d => extractRecordId(d.fields.klient) === selectedKlientId)
      .sort((a, b) => (b.fields.besuchsdatum ?? '').localeCompare(a.fields.besuchsdatum ?? '')),
    [enrichedPflegedurchfuehrung, selectedKlientId]
  );

  // KPI stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayVisits = enrichedPflegedurchfuehrung.filter(d => d.fields.besuchsdatum?.startsWith(todayStr)).length;
  const openWunden = enrichedWunddokumentation.filter(w => {
    const next = w.fields.naechster_verbandwechsel;
    return next && next <= todayStr;
  }).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    if (type === 'medikament') await LivingAppsService.deleteMedikamentenplanEntry(id);
    else if (type === 'wunde') await LivingAppsService.deleteWunddokumentationEntry(id);
    else if (type === 'vital') await LivingAppsService.deleteVitalwerteErfassungEntry(id);
    else if (type === 'pflegeplan') await LivingAppsService.deletePflegeplanungEntry(id);
    else if (type === 'durchfuehrung') await LivingAppsService.deletePflegedurchfuehrungEntry(id);
    setDeleteTarget(null);
    fetchAll();
  };

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Klienten"
          value={String(klientenstammdaten.length)}
          description="Aktive Klienten"
          icon={<Users size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Besuche heute"
          value={String(todayVisits)}
          description="Pflegedurchführungen"
          icon={<Calendar size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Verbandwechsel"
          value={String(openWunden)}
          description="Fällig / überfällig"
          icon={<Bandage size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Pflegekräfte"
          value={String(pflegefachkraefte.filter(p => p.fields.aktiv).length)}
          description="Aktiv im Dienst"
          icon={<Heart size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-[600px]">
        {/* LEFT: Client List */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col border border-border rounded-2xl overflow-hidden bg-card">
          <div className="p-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Klienten</p>
            <input
              type="text"
              placeholder="Suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-sm px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredKlienten.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Keine Klienten gefunden
              </div>
            ) : (
              filteredKlienten.map(klient => {
                const name = `${klient.fields.vorname ?? ''} ${klient.fields.nachname ?? ''}`.trim() || 'Unbekannt';
                const isSelected = klient.record_id === selectedKlientId;
                const klientVitalCount = enrichedVitalwerteErfassung.filter(v => extractRecordId(v.fields.klient) === klient.record_id).length;
                const klientMedCount = enrichedMedikamentenplan.filter(m => extractRecordId(m.fields.klient) === klient.record_id).length;
                return (
                  <button
                    key={klient.record_id}
                    onClick={() => {
                      setSelectedKlientId(klient.record_id);
                      setActiveTab('vitals');
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors flex items-center gap-3 min-w-0 ${
                      isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                      {(klient.fields.vorname?.[0] ?? '?')}{(klient.fields.nachname?.[0] ?? '')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {klient.fields.pflegegrad && (
                          <span className="text-xs text-muted-foreground">{klient.fields.pflegegrad.label}</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-1">
                        {klientVitalCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Activity size={10} /> {klientVitalCount}
                          </span>
                        )}
                        {klientMedCount > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Pill size={10} /> {klientMedCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground/40'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="flex-1 min-w-0 border border-border rounded-2xl overflow-hidden bg-card flex flex-col">
          {!selectedKlient ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <User size={28} className="text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground">Klient auswählen</p>
              <p className="text-sm text-muted-foreground max-w-xs">Wählen Sie links einen Klienten aus, um alle Pflegedaten im Überblick zu sehen.</p>
            </div>
          ) : (
            <>
              {/* Client Header */}
              <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-start gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0 text-primary font-bold text-lg">
                    {(selectedKlient.fields.vorname?.[0] ?? '?')}{(selectedKlient.fields.nachname?.[0] ?? '')}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-lg truncate">
                      {selectedKlient.fields.vorname} {selectedKlient.fields.nachname}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {selectedKlient.fields.pflegegrad && (
                        <Badge variant="secondary" className="text-xs">{selectedKlient.fields.pflegegrad.label}</Badge>
                      )}
                      {selectedKlient.fields.geburtsdatum && (
                        <span className="text-xs text-muted-foreground">* {formatDate(selectedKlient.fields.geburtsdatum)}</span>
                      )}
                      {selectedKlient.fields.stadt && (
                        <span className="text-xs text-muted-foreground">{selectedKlient.fields.stadt}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  {selectedKlient.fields.telefon && (
                    <a href={`tel:${selectedKlient.fields.telefon}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <Phone size={13} className="shrink-0" />
                      <span className="hidden sm:inline">{selectedKlient.fields.telefon}</span>
                    </a>
                  )}
                  {selectedKlient.fields.hausarzt_name && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <User size={13} className="shrink-0" />
                      <span className="hidden sm:inline truncate max-w-[120px]">{selectedKlient.fields.hausarzt_name}</span>
                    </div>
                  )}
                  {selectedKlient.fields.besonderheiten && (
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span className="hidden sm:inline">Besonderheiten</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedKlientId(null)}
                  className="lg:hidden p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex overflow-x-auto border-b border-border bg-muted/10 shrink-0">
                {([
                  { id: 'vitals', label: 'Vitalwerte', icon: Activity, count: clientVitals.length },
                  { id: 'wunden', label: 'Wunden', icon: Bandage, count: clientWunden.length },
                  { id: 'medikamente', label: 'Medikamente', icon: Pill, count: clientMedikamente.length },
                  { id: 'pflegeplanung', label: 'Pflegeplanung', icon: ClipboardList, count: clientPflegeplanung.length },
                  { id: 'durchfuehrung', label: 'Durchführung', icon: Clock, count: clientDurchfuehrung.length },
                ] as { id: ActiveTab; label: string; icon: React.ElementType; count: number }[]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors shrink-0 ${
                      activeTab === tab.id
                        ? 'border-primary text-primary font-medium'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    <tab.icon size={14} className="shrink-0" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${activeTab === tab.id ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-4">

                {/* VITALS TAB */}
                {activeTab === 'vitals' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-muted-foreground">Vitalwerte-Verlauf</p>
                      <Button size="sm" variant="outline" onClick={() => { setVitalEdit(null); setVitalDialog(true); }}>
                        <Plus size={14} className="mr-1 shrink-0" /> Erfassen
                      </Button>
                    </div>
                    {clientVitals.length === 0 ? (
                      <EmptyState icon={<Activity size={32} className="text-muted-foreground" />} label="Noch keine Vitalwerte" />
                    ) : (
                      <div className="space-y-2">
                        {clientVitals.map(v => (
                          <div key={v.record_id} className="border border-border rounded-xl p-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground mb-2">{formatDate(v.fields.messzeitpunkt)}</p>
                                <div className="flex flex-wrap gap-3">
                                  {v.fields.blutdruck_systolisch != null && v.fields.blutdruck_diastolisch != null && (
                                    <VitalChip label="Blutdruck" value={`${v.fields.blutdruck_systolisch}/${v.fields.blutdruck_diastolisch} mmHg`} />
                                  )}
                                  {v.fields.puls != null && <VitalChip label="Puls" value={`${v.fields.puls} /min`} />}
                                  {v.fields.temperatur != null && <VitalChip label="Temp." value={`${v.fields.temperatur} °C`} />}
                                  {v.fields.sauerstoffsaettigung != null && <VitalChip label="SpO₂" value={`${v.fields.sauerstoffsaettigung}%`} />}
                                  {v.fields.blutzucker != null && <VitalChip label="BZ" value={`${v.fields.blutzucker} mg/dl`} />}
                                  {v.fields.gewicht != null && <VitalChip label="Gewicht" value={`${v.fields.gewicht} kg`} />}
                                </div>
                                {v.fields.bemerkungen && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{v.fields.bemerkungen}</p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button onClick={() => { setVitalEdit(v); setVitalDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                  <Pencil size={13} className="text-muted-foreground" />
                                </button>
                                <button onClick={() => setDeleteTarget({ type: 'vital', id: v.record_id })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                  <Trash2 size={13} className="text-destructive/60" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* WUNDEN TAB */}
                {activeTab === 'wunden' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-muted-foreground">Wunddokumentation</p>
                      <Button size="sm" variant="outline" onClick={() => { setWundEdit(null); setWundDialog(true); }}>
                        <Plus size={14} className="mr-1 shrink-0" /> Neue Wunde
                      </Button>
                    </div>
                    {clientWunden.length === 0 ? (
                      <EmptyState icon={<Bandage size={32} className="text-muted-foreground" />} label="Keine Wunddokumentation" />
                    ) : (
                      <div className="space-y-2">
                        {clientWunden.map(w => {
                          const isOverdue = w.fields.naechster_verbandwechsel && w.fields.naechster_verbandwechsel <= todayStr;
                          return (
                            <div key={w.record_id} className={`border rounded-xl p-3 transition-colors hover:bg-muted/20 ${isOverdue ? 'border-amber-300 bg-amber-50/30' : 'border-border'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{w.fields.wundtyp?.label ?? 'Wunde'}</span>
                                    {w.fields.koerperregion && <Badge variant="outline" className="text-xs">{w.fields.koerperregion.label}</Badge>}
                                    {isOverdue && <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200">Verbandwechsel fällig</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{formatDate(w.fields.dokumentationsdatum)}</p>
                                  {(w.fields.wundlaenge != null || w.fields.wundbreite != null) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {w.fields.wundlaenge}×{w.fields.wundbreite} cm{w.fields.wundtiefe ? ` × ${w.fields.wundtiefe} cm tief` : ''}
                                    </p>
                                  )}
                                  {w.fields.wundzustand && w.fields.wundzustand.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {w.fields.wundzustand.map(z => (
                                        <span key={z.key} className="text-xs bg-muted px-1.5 py-0.5 rounded">{z.label}</span>
                                      ))}
                                    </div>
                                  )}
                                  {w.fields.naechster_verbandwechsel && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Nächster Verbandwechsel: {formatDate(w.fields.naechster_verbandwechsel)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => { setWundEdit(w); setWundDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                    <Pencil size={13} className="text-muted-foreground" />
                                  </button>
                                  <button onClick={() => setDeleteTarget({ type: 'wunde', id: w.record_id })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                    <Trash2 size={13} className="text-destructive/60" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* MEDIKAMENTE TAB */}
                {activeTab === 'medikamente' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-muted-foreground">Medikamentenplan</p>
                      <Button size="sm" variant="outline" onClick={() => { setMedEdit(null); setMedDialog(true); }}>
                        <Plus size={14} className="mr-1 shrink-0" /> Hinzufügen
                      </Button>
                    </div>
                    {clientMedikamente.length === 0 ? (
                      <EmptyState icon={<Pill size={32} className="text-muted-foreground" />} label="Keine Medikamente eingetragen" />
                    ) : (
                      <div className="space-y-2">
                        {clientMedikamente.map(m => (
                          <div key={m.record_id} className="border border-border rounded-xl p-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{m.fields.medikamentenname ?? 'Unbekannt'}</span>
                                  {m.fields.darreichungsform && (
                                    <Badge variant="outline" className="text-xs">{m.fields.darreichungsform.label}</Badge>
                                  )}
                                </div>
                                {m.fields.wirkstoff && <p className="text-xs text-muted-foreground">{m.fields.wirkstoff}</p>}
                                {m.fields.dosierung && <p className="text-xs text-muted-foreground">Dosis: {m.fields.dosierung}</p>}
                                {m.fields.einnahmezeiten && m.fields.einnahmezeiten.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {m.fields.einnahmezeiten.map(z => (
                                      <span key={z.key} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{z.label}</span>
                                    ))}
                                  </div>
                                )}
                                {m.fields.verordnender_arzt && (
                                  <p className="text-xs text-muted-foreground mt-1">Dr. {m.fields.verordnender_arzt}</p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button onClick={() => { setMedEdit(m); setMedDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                  <Pencil size={13} className="text-muted-foreground" />
                                </button>
                                <button onClick={() => setDeleteTarget({ type: 'medikament', id: m.record_id })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                  <Trash2 size={13} className="text-destructive/60" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PFLEGEPLANUNG TAB */}
                {activeTab === 'pflegeplanung' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-muted-foreground">Pflegepläne</p>
                      <Button size="sm" variant="outline" onClick={() => { setPflegeplanEdit(null); setPflegeplanDialog(true); }}>
                        <Plus size={14} className="mr-1 shrink-0" /> Neuer Plan
                      </Button>
                    </div>
                    {clientPflegeplanung.length === 0 ? (
                      <EmptyState icon={<ClipboardList size={32} className="text-muted-foreground" />} label="Kein Pflegeplan vorhanden" />
                    ) : (
                      <div className="space-y-3">
                        {clientPflegeplanung.map(p => (
                          <div key={p.record_id} className="border border-border rounded-xl p-4 hover:bg-muted/20 transition-colors">
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div>
                                <p className="font-medium text-sm">Pflegeplan vom {formatDate(p.fields.erstellungsdatum)}</p>
                                <p className="text-xs text-muted-foreground">{p.erstellende_pflegekraftName}</p>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button onClick={() => { setPflegeplanEdit(p); setPflegeplanDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                  <Pencil size={13} className="text-muted-foreground" />
                                </button>
                                <button onClick={() => setDeleteTarget({ type: 'pflegeplan', id: p.record_id })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                  <Trash2 size={13} className="text-destructive/60" />
                                </button>
                              </div>
                            </div>
                            {p.fields.risiken && p.fields.risiken.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Risiken:</p>
                                <div className="flex flex-wrap gap-1">
                                  {p.fields.risiken.map(r => (
                                    <span key={r.key} className="text-xs bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded">{r.label}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {p.fields.pflegeziele && (
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">Ziele:</span> <span className="line-clamp-2">{p.fields.pflegeziele}</span>
                              </div>
                            )}
                            {p.fields.naechste_evaluation && (
                              <p className="text-xs text-muted-foreground mt-2">Nächste Evaluation: {formatDate(p.fields.naechste_evaluation)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PFLEGEDURCHFÜHRUNG TAB */}
                {activeTab === 'durchfuehrung' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-muted-foreground">Durchgeführte Pflege</p>
                      <Button size="sm" variant="outline" onClick={() => { setDurchfuehrungEdit(null); setDurchfuehrungDialog(true); }}>
                        <Plus size={14} className="mr-1 shrink-0" /> Erfassen
                      </Button>
                    </div>
                    {clientDurchfuehrung.length === 0 ? (
                      <EmptyState icon={<Clock size={32} className="text-muted-foreground" />} label="Keine Pflegedurchführungen" />
                    ) : (
                      <div className="space-y-2">
                        {clientDurchfuehrung.map(d => (
                          <div key={d.record_id} className={`border rounded-xl p-3 hover:bg-muted/20 transition-colors ${d.fields.massnahmen_erforderlich ? 'border-orange-200 bg-orange-50/20' : 'border-border'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className="text-xs text-muted-foreground">{formatDate(d.fields.besuchsdatum)}</span>
                                  {d.fields.dauer_minuten && (
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{d.fields.dauer_minuten} min</span>
                                  )}
                                  {d.fields.massnahmen_erforderlich && (
                                    <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">Maßnahmen erforderlich</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">{d.durchfuehrende_pflegekraftName}</p>
                                {d.fields.leistungsart && d.fields.leistungsart.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {d.fields.leistungsart.map(l => (
                                      <span key={l.key} className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">{l.label}</span>
                                    ))}
                                  </div>
                                )}
                                {d.fields.pflegebericht && (
                                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{d.fields.pflegebericht}</p>
                                )}
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <button onClick={() => { setDurchfuehrungEdit(d); setDurchfuehrungDialog(true); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                                  <Pencil size={13} className="text-muted-foreground" />
                                </button>
                                <button onClick={() => setDeleteTarget({ type: 'durchfuehrung', id: d.record_id })} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                                  <Trash2 size={13} className="text-destructive/60" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <MedikamentenplanDialog
        open={medDialog}
        onClose={() => { setMedDialog(false); setMedEdit(null); }}
        onSubmit={async (fields) => {
          if (medEdit) {
            await LivingAppsService.updateMedikamentenplanEntry(medEdit.record_id, fields);
          } else {
            const klientUrl = selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : undefined;
            await LivingAppsService.createMedikamentenplanEntry({ ...fields, klient: klientUrl });
          }
          fetchAll();
        }}
        defaultValues={medEdit ? {
          ...medEdit.fields,
          klient: selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : medEdit.fields.klient,
        } : (selectedKlientId ? { klient: createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) } : undefined)}
        klientenstammdatenList={klientenstammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['Medikamentenplan']}
      />

      <WunddokumentationDialog
        open={wundDialog}
        onClose={() => { setWundDialog(false); setWundEdit(null); }}
        onSubmit={async (fields) => {
          if (wundEdit) {
            await LivingAppsService.updateWunddokumentationEntry(wundEdit.record_id, fields);
          } else {
            const klientUrl = selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : undefined;
            await LivingAppsService.createWunddokumentationEntry({ ...fields, klient: klientUrl });
          }
          fetchAll();
        }}
        defaultValues={wundEdit ? {
          ...wundEdit.fields,
          klient: selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : wundEdit.fields.klient,
        } : (selectedKlientId ? { klient: createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) } : undefined)}
        klientenstammdatenList={klientenstammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['Wunddokumentation']}
      />

      <VitalwerteErfassungDialog
        open={vitalDialog}
        onClose={() => { setVitalDialog(false); setVitalEdit(null); }}
        onSubmit={async (fields) => {
          if (vitalEdit) {
            await LivingAppsService.updateVitalwerteErfassungEntry(vitalEdit.record_id, fields);
          } else {
            const klientUrl = selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : undefined;
            await LivingAppsService.createVitalwerteErfassungEntry({ ...fields, klient: klientUrl });
          }
          fetchAll();
        }}
        defaultValues={vitalEdit ? {
          ...vitalEdit.fields,
          klient: selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : vitalEdit.fields.klient,
        } : (selectedKlientId ? { klient: createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) } : undefined)}
        klientenstammdatenList={klientenstammdaten}
        enablePhotoScan={AI_PHOTO_SCAN['VitalwerteErfassung']}
      />

      <PflegeplanungDialog
        open={pflegeplanDialog}
        onClose={() => { setPflegeplanDialog(false); setPflegeplanEdit(null); }}
        onSubmit={async (fields) => {
          if (pflegeplanEdit) {
            await LivingAppsService.updatePflegeplanungEntry(pflegeplanEdit.record_id, fields);
          } else {
            const klientUrl = selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : undefined;
            await LivingAppsService.createPflegeplanungEntry({ ...fields, klient: klientUrl });
          }
          fetchAll();
        }}
        defaultValues={pflegeplanEdit ? {
          ...pflegeplanEdit.fields,
          klient: selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : pflegeplanEdit.fields.klient,
        } : (selectedKlientId ? { klient: createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) } : undefined)}
        klientenstammdatenList={klientenstammdaten}
        pflegefachkraefteList={pflegefachkraefte}
        enablePhotoScan={AI_PHOTO_SCAN['Pflegeplanung']}
      />

      <PflegedurchfuehrungDialog
        open={durchfuehrungDialog}
        onClose={() => { setDurchfuehrungDialog(false); setDurchfuehrungEdit(null); }}
        onSubmit={async (fields) => {
          if (durchfuehrungEdit) {
            await LivingAppsService.updatePflegedurchfuehrungEntry(durchfuehrungEdit.record_id, fields);
          } else {
            const klientUrl = selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : undefined;
            await LivingAppsService.createPflegedurchfuehrungEntry({ ...fields, klient: klientUrl });
          }
          fetchAll();
        }}
        defaultValues={durchfuehrungEdit ? {
          ...durchfuehrungEdit.fields,
          klient: selectedKlientId ? createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) : durchfuehrungEdit.fields.klient,
        } : (selectedKlientId ? { klient: createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, selectedKlientId) } : undefined)}
        klientenstammdatenList={klientenstammdaten}
        tourenplanungList={tourenplanung}
        pflegefachkraefteList={pflegefachkraefte}
        enablePhotoScan={AI_PHOTO_SCAN['Pflegedurchfuehrung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function VitalChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
      <div className="opacity-40">{icon}</div>
      <p className="text-sm text-muted-foreground">{label}</p>
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
      <Skeleton className="h-64 rounded-2xl" />
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
