import type { Leistungsnachweis, Klientenstammdaten } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Pencil } from 'lucide-react';

interface LeistungsnachweisViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Leistungsnachweis | null;
  onEdit: (record: Leistungsnachweis) => void;
  klientenstammdatenList: Klientenstammdaten[];
}

export function LeistungsnachweisViewDialog({ open, onClose, record, onEdit, klientenstammdatenList }: LeistungsnachweisViewDialogProps) {
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
          <DialogTitle>Leistungsnachweis anzeigen</DialogTitle>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}