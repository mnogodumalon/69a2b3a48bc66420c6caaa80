import type { Medikamentenplan, Klientenstammdaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface MedikamentenplanViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Medikamentenplan | null;
  onEdit: (record: Medikamentenplan) => void;
  klientenstammdatenList: Klientenstammdaten[];
}

export function MedikamentenplanViewDialog({ open, onClose, record, onEdit, klientenstammdatenList }: MedikamentenplanViewDialogProps) {
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
          <DialogTitle>Medikamentenplan anzeigen</DialogTitle>
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
            <Label className="text-xs text-muted-foreground">Medikamentenname</Label>
            <p className="text-sm">{record.fields.medikamentenname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Wirkstoff</Label>
            <p className="text-sm">{record.fields.wirkstoff ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Darreichungsform</Label>
            <Badge variant="secondary">{record.fields.darreichungsform?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dosierung</Label>
            <p className="text-sm">{record.fields.dosierung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einnahmezeiten</Label>
            <p className="text-sm">{Array.isArray(record.fields.einnahmezeiten) ? record.fields.einnahmezeiten.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Einnahmehinweise</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.einnahmehinweise ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verordnungsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.verordnungsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Verordnender Arzt</Label>
            <p className="text-sm">{record.fields.verordnender_arzt ?? '—'}</p>
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