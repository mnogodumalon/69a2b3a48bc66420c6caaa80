import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { VitalwerteErfassung, Klientenstammdaten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { VitalwerteErfassungDialog } from '@/components/dialogs/VitalwerteErfassungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function VitalwerteErfassungPage() {
  const [records, setRecords] = useState<VitalwerteErfassung[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VitalwerteErfassung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VitalwerteErfassung | null>(null);
  const [klientenstammdatenList, setKlientenstammdatenList] = useState<Klientenstammdaten[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, klientenstammdatenData] = await Promise.all([
        LivingAppsService.getVitalwerteErfassung(),
        LivingAppsService.getKlientenstammdaten(),
      ]);
      setRecords(mainData);
      setKlientenstammdatenList(klientenstammdatenData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: VitalwerteErfassung['fields']) {
    await LivingAppsService.createVitalwerteErfassungEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: VitalwerteErfassung['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateVitalwerteErfassungEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteVitalwerteErfassungEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  function getKlientenstammdatenDisplayName(url?: string) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return klientenstammdatenList.find(r => r.record_id === id)?.fields.vorname ?? '—';
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
      title="Vitalwerte-Erfassung"
      subtitle={`${records.length} Vitalwerte-Erfassung im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Vitalwerte-Erfassung suchen..."
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
              <TableHead>Messzeitpunkt</TableHead>
              <TableHead>Blutdruck systolisch (mmHg)</TableHead>
              <TableHead>Blutdruck diastolisch (mmHg)</TableHead>
              <TableHead>Puls (Schläge/min)</TableHead>
              <TableHead>Körpertemperatur (°C)</TableHead>
              <TableHead>Gewicht (kg)</TableHead>
              <TableHead>Blutzucker (mg/dl)</TableHead>
              <TableHead>Sauerstoffsättigung (%)</TableHead>
              <TableHead>Atemfrequenz (Atemzüge/min)</TableHead>
              <TableHead>Verwendetes Messgerät</TableHead>
              <TableHead>Bemerkungen</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell>{getKlientenstammdatenDisplayName(record.fields.klient)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.messzeitpunkt)}</TableCell>
                <TableCell>{record.fields.blutdruck_systolisch ?? '—'}</TableCell>
                <TableCell>{record.fields.blutdruck_diastolisch ?? '—'}</TableCell>
                <TableCell>{record.fields.puls ?? '—'}</TableCell>
                <TableCell>{record.fields.temperatur ?? '—'}</TableCell>
                <TableCell>{record.fields.gewicht ?? '—'}</TableCell>
                <TableCell>{record.fields.blutzucker ?? '—'}</TableCell>
                <TableCell>{record.fields.sauerstoffsaettigung ?? '—'}</TableCell>
                <TableCell>{record.fields.atemfrequenz ?? '—'}</TableCell>
                <TableCell className="font-medium">{record.fields.messgeraet ?? '—'}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.bemerkungen ?? '—'}</span></TableCell>
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
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Vitalwerte-Erfassung. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <VitalwerteErfassungDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        klientenstammdatenList={klientenstammdatenList}
        enablePhotoScan={AI_PHOTO_SCAN['VitalwerteErfassung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Vitalwerte-Erfassung löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}