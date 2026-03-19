import type { Wunddokumentation, Klientenstammdaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface WunddokumentationViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Wunddokumentation | null;
  onEdit: (record: Wunddokumentation) => void;
  klientenstammdatenList: Klientenstammdaten[];
}

export function WunddokumentationViewDialog({ open, onClose, record, onEdit, klientenstammdatenList }: WunddokumentationViewDialogProps) {
  function getKlientenstammdatenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return klientenstammdatenList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wunddokumentation anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dokumentationsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.dokumentationsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Körperregion</Label>
            <Badge variant="secondary">{record.fields.koerperregion?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Genaue Lokalisation</Label>
            <p className="text-sm">{record.fields.genaue_lokalisation ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wundtyp</Label>
            <Badge variant="secondary">{record.fields.wundtyp?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wundbreite (cm)</Label>
            <p className="text-sm">{record.fields.wundbreite ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wundtiefe (cm)</Label>
            <p className="text-sm">{record.fields.wundtiefe ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wundstadium (Dekubitus)</Label>
            <Badge variant="secondary">{record.fields.wundstadium?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wundzustand</Label>
            <p className="text-sm">{Array.isArray(record.fields.wundzustand) ? record.fields.wundzustand.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Exsudatmenge</Label>
            <Badge variant="secondary">{record.fields.exsudat?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geruchsbildung vorhanden</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.geruch ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.geruch ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wundfoto</Label>
            {record.fields.wundfoto ? (
              <div className="relative w-full rounded-lg bg-muted overflow-hidden border">
                <img src={record.fields.wundfoto} alt="" className="w-full h-auto object-contain" />
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Durchgeführte Maßnahmen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.durchgefuehrte_massnahmen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verwendete Materialien</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.verwendete_materialien ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nächster Verbandwechsel</Label>
            <p className="text-sm">{formatDate(record.fields.naechster_verbandwechsel)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bemerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkungen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Klient</Label>
            <p className="text-sm">{getKlientenstammdatenDisplayName(record.fields.klient)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wundlänge (cm)</Label>
            <p className="text-sm">{record.fields.wundlaenge ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}