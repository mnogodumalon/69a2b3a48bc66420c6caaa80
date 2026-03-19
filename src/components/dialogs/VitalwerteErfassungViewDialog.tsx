import type { VitalwerteErfassung, Klientenstammdaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface VitalwerteErfassungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: VitalwerteErfassung | null;
  onEdit: (record: VitalwerteErfassung) => void;
  klientenstammdatenList: Klientenstammdaten[];
}

export function VitalwerteErfassungViewDialog({ open, onClose, record, onEdit, klientenstammdatenList }: VitalwerteErfassungViewDialogProps) {
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
          <DialogTitle>Vitalwerte-Erfassung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Klient</Label>
            <p className="text-sm">{getKlientenstammdatenDisplayName(record.fields.klient)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Messzeitpunkt</Label>
            <p className="text-sm">{formatDate(record.fields.messzeitpunkt)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Blutdruck systolisch (mmHg)</Label>
            <p className="text-sm">{record.fields.blutdruck_systolisch ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Blutdruck diastolisch (mmHg)</Label>
            <p className="text-sm">{record.fields.blutdruck_diastolisch ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Puls (Schläge/min)</Label>
            <p className="text-sm">{record.fields.puls ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Körpertemperatur (°C)</Label>
            <p className="text-sm">{record.fields.temperatur ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gewicht (kg)</Label>
            <p className="text-sm">{record.fields.gewicht ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Blutzucker (mg/dl)</Label>
            <p className="text-sm">{record.fields.blutzucker ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sauerstoffsättigung (%)</Label>
            <p className="text-sm">{record.fields.sauerstoffsaettigung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Atemfrequenz (Atemzüge/min)</Label>
            <p className="text-sm">{record.fields.atemfrequenz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verwendetes Messgerät</Label>
            <p className="text-sm">{record.fields.messgeraet ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bemerkungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkungen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}