import type { Tourenplanung, Pflegefachkraefte, Klientenstammdaten } from '@/types/app';
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

interface TourenplanungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Tourenplanung | null;
  onEdit: (record: Tourenplanung) => void;
  pflegefachkraefteList: Pflegefachkraefte[];
  klientenstammdatenList: Klientenstammdaten[];
}

export function TourenplanungViewDialog({ open, onClose, record, onEdit, pflegefachkraefteList, klientenstammdatenList }: TourenplanungViewDialogProps) {
  function getPflegefachkraefteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return pflegefachkraefteList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

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
          <DialogTitle>Tourenplanung anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tourdatum</Label>
            <p className="text-sm">{formatDate(record.fields.tourdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tourbezeichnung</Label>
            <p className="text-sm">{record.fields.tourbezeichnung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zugeordnete Pflegekräfte</Label>
            <p className="text-sm">{getPflegefachkraefteDisplayName(record.fields.zugeordnete_pflegekraefte)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Klienten auf der Tour</Label>
            <p className="text-sm">{getKlientenstammdatenDisplayName(record.fields.klienten)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Startzeit</Label>
            <p className="text-sm">{record.fields.startzeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geplante Endzeit</Label>
            <p className="text-sm">{record.fields.endzeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Notfall-Tour</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.notfaelle ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.notfaelle ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bemerkungen zur Tour</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bemerkungen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}