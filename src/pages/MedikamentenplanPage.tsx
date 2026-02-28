import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Medikamentenplan, Klientenstammdaten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { MedikamentenplanDialog } from '@/components/dialogs/MedikamentenplanDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { displayLookup, displayMultiLookup } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function MedikamentenplanPage() {
  const [records, setRecords] = useState<Medikamentenplan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Medikamentenplan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medikamentenplan | null>(null);
  const [klientenstammdatenList, setKlientenstammdatenList] = useState<Klientenstammdaten[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, klientenstammdatenData] = await Promise.all([
        LivingAppsService.getMedikamentenplan(),
        LivingAppsService.getKlientenstammdaten(),
      ]);
      setRecords(mainData);
      setKlientenstammdatenList(klientenstammdatenData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Medikamentenplan['fields']) {
    await LivingAppsService.createMedikamentenplanEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Medikamentenplan['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateMedikamentenplanEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteMedikamentenplanEntry(deleteTarget.record_id);
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
      title="Medikamentenplan"
      subtitle={`${records.length} Medikamentenplan im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Medikamentenplan suchen..."
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
              <TableHead>Medikamentenname</TableHead>
              <TableHead>Wirkstoff</TableHead>
              <TableHead>Darreichungsform</TableHead>
              <TableHead>Dosierung</TableHead>
              <TableHead>Einnahmezeiten</TableHead>
              <TableHead>Einnahmehinweise</TableHead>
              <TableHead>Verordnungsdatum</TableHead>
              <TableHead>Verordnender Arzt</TableHead>
              <TableHead>Bemerkungen</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell>{getKlientenstammdatenDisplayName(record.fields.klient)}</TableCell>
                <TableCell className="font-medium">{record.fields.medikamentenname ?? '—'}</TableCell>
                <TableCell>{record.fields.wirkstoff ?? '—'}</TableCell>
                <TableCell><Badge variant="secondary">{displayLookup(record.fields.darreichungsform)}</Badge></TableCell>
                <TableCell>{record.fields.dosierung ?? '—'}</TableCell>
                <TableCell>{displayMultiLookup(record.fields.einnahmezeiten)}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.einnahmehinweise ?? '—'}</span></TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.verordnungsdatum)}</TableCell>
                <TableCell>{record.fields.verordnender_arzt ?? '—'}</TableCell>
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
                <TableCell colSpan={11} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Medikamentenplan. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <MedikamentenplanDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        klientenstammdatenList={klientenstammdatenList}
        enablePhotoScan={AI_PHOTO_SCAN['Medikamentenplan']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Medikamentenplan löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}