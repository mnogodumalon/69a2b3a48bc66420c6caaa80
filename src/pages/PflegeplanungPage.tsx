import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Pflegeplanung, Klientenstammdaten, Pflegefachkraefte } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { PflegeplanungDialog } from '@/components/dialogs/PflegeplanungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { displayMultiLookup } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function PflegeplanungPage() {
  const [records, setRecords] = useState<Pflegeplanung[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Pflegeplanung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pflegeplanung | null>(null);
  const [klientenstammdatenList, setKlientenstammdatenList] = useState<Klientenstammdaten[]>([]);
  const [pflegefachkraefteList, setPflegefachkraefteList] = useState<Pflegefachkraefte[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, klientenstammdatenData, pflegefachkraefteData] = await Promise.all([
        LivingAppsService.getPflegeplanung(),
        LivingAppsService.getKlientenstammdaten(),
        LivingAppsService.getPflegefachkraefte(),
      ]);
      setRecords(mainData);
      setKlientenstammdatenList(klientenstammdatenData);
      setPflegefachkraefteList(pflegefachkraefteData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Pflegeplanung['fields']) {
    await LivingAppsService.createPflegeplanungEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Pflegeplanung['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updatePflegeplanungEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deletePflegeplanungEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getKlientenstammdatenDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return klientenstammdatenList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getPflegefachkraefteDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return pflegefachkraefteList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="Pflegeplanung"
      subtitle={`${records.length} Pflegeplanung im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pflegeplanung suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Klient</TableHead>
              <TableHead>Erstellende Pflegefachkraft</TableHead>
              <TableHead>Erstellungsdatum</TableHead>
              <TableHead>Aktuelle pflegebedürftige Situation</TableHead>
              <TableHead>Vorerkrankungen</TableHead>
              <TableHead>Aktuelle Diagnosen</TableHead>
              <TableHead>Ressourcen und Fähigkeiten</TableHead>
              <TableHead>Risiken</TableHead>
              <TableHead>Pflegediagnosen</TableHead>
              <TableHead>Pflegeziele</TableHead>
              <TableHead>Geplante Pflegemaßnahmen</TableHead>
              <TableHead>Nächste Evaluation</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell>{getKlientenstammdatenDisplayName(record.fields.klient)}</TableCell>
                <TableCell>{getPflegefachkraefteDisplayName(record.fields.erstellende_pflegekraft)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.erstellungsdatum)}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.pflegebeduerftige_situation ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.vorerkrankungen ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.aktuelle_diagnosen ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.ressourcen ?? '—'}</span></TableCell>
                <TableCell>{displayMultiLookup(record.fields.risiken)}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.pflegediagnosen ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.pflegeziele ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.geplante_massnahmen ?? '—'}</span></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.naechste_evaluation)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Pflegeplanung. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PflegeplanungDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        klientenstammdatenList={klientenstammdatenList}
        pflegefachkraefteList={pflegefachkraefteList}
        enablePhotoScan={AI_PHOTO_SCAN['Pflegeplanung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Pflegeplanung löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}