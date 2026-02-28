import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Klientenstammdaten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { KlientenstammdatenDialog } from '@/components/dialogs/KlientenstammdatenDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import { displayLookup } from '@/lib/formatters';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

export default function KlientenstammdatenPage() {
  const [records, setRecords] = useState<Klientenstammdaten[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Klientenstammdaten | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Klientenstammdaten | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      setRecords(await LivingAppsService.getKlientenstammdaten());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Klientenstammdaten['fields']) {
    await LivingAppsService.createKlientenstammdatenEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Klientenstammdaten['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateKlientenstammdatenEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteKlientenstammdatenEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
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
      title="Klientenstammdaten"
      subtitle={`${records.length} Klientenstammdaten im System`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Klientenstammdaten suchen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vorname</TableHead>
              <TableHead>Nachname</TableHead>
              <TableHead>Geburtsdatum</TableHead>
              <TableHead>Geschlecht</TableHead>
              <TableHead>Straße</TableHead>
              <TableHead>Hausnummer</TableHead>
              <TableHead>Postleitzahl</TableHead>
              <TableHead>Stadt</TableHead>
              <TableHead>Telefonnummer</TableHead>
              <TableHead>Mobilnummer</TableHead>
              <TableHead>E-Mail-Adresse</TableHead>
              <TableHead>Wohnadresse (GPS)</TableHead>
              <TableHead>Krankenversicherung</TableHead>
              <TableHead>Versichertennummer</TableHead>
              <TableHead>Pflegegrad</TableHead>
              <TableHead>Kostenträger</TableHead>
              <TableHead>Notfallkontakt Vorname</TableHead>
              <TableHead>Notfallkontakt Nachname</TableHead>
              <TableHead>Beziehung zum Klienten</TableHead>
              <TableHead>Notfallkontakt Telefon</TableHead>
              <TableHead>Hausarzt Name</TableHead>
              <TableHead>Hausarzt Telefon</TableHead>
              <TableHead>Besonderheiten</TableHead>
              <TableHead className="w-24">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{record.fields.vorname ?? '—'}</TableCell>
                <TableCell>{record.fields.nachname ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.geburtsdatum)}</TableCell>
                <TableCell><Badge variant="secondary">{displayLookup(record.fields.geschlecht)}</Badge></TableCell>
                <TableCell>{record.fields.strasse ?? '—'}</TableCell>
                <TableCell>{record.fields.hausnummer ?? '—'}</TableCell>
                <TableCell>{record.fields.postleitzahl ?? '—'}</TableCell>
                <TableCell>{record.fields.stadt ?? '—'}</TableCell>
                <TableCell>{record.fields.telefon ?? '—'}</TableCell>
                <TableCell>{record.fields.mobil ?? '—'}</TableCell>
                <TableCell>{record.fields.email ?? '—'}</TableCell>
                <TableCell>{record.fields.standort ?? '—'}</TableCell>
                <TableCell>{record.fields.krankenversicherung ?? '—'}</TableCell>
                <TableCell>{record.fields.versichertennummer ?? '—'}</TableCell>
                <TableCell><Badge variant="secondary">{displayLookup(record.fields.pflegegrad)}</Badge></TableCell>
                <TableCell>{record.fields.kostentraeger ?? '—'}</TableCell>
                <TableCell>{record.fields.notfallkontakt_vorname ?? '—'}</TableCell>
                <TableCell>{record.fields.notfallkontakt_nachname ?? '—'}</TableCell>
                <TableCell>{record.fields.notfallkontakt_beziehung ?? '—'}</TableCell>
                <TableCell>{record.fields.notfallkontakt_telefon ?? '—'}</TableCell>
                <TableCell>{record.fields.hausarzt_name ?? '—'}</TableCell>
                <TableCell>{record.fields.hausarzt_telefon ?? '—'}</TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.besonderheiten ?? '—'}</span></TableCell>
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
                <TableCell colSpan={24} className="text-center py-16 text-muted-foreground">
                  {search ? 'Keine Ergebnisse gefunden.' : 'Noch keine Klientenstammdaten. Jetzt hinzufügen!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <KlientenstammdatenDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['Klientenstammdaten']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Klientenstammdaten löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </PageShell>
  );
}