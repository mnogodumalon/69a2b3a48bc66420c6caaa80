import type { Pflegeplanung, Klientenstammdaten, Pflegefachkraefte } from '@/types/app';
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

interface PflegeplanungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Pflegeplanung | null;
  onEdit: (record: Pflegeplanung) => void;
  klientenstammdatenList: Klientenstammdaten[];
  pflegefachkraefteList: Pflegefachkraefte[];
}

export function PflegeplanungViewDialog({ open, onClose, record, onEdit, klientenstammdatenList, pflegefachkraefteList }: PflegeplanungViewDialogProps) {
  function getKlientenstammdatenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return klientenstammdatenList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getPflegefachkraefteDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return pflegefachkraefteList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pflegeplanung anzeigen</DialogTitle>
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
            <Label className="text-xs text-muted-foreground">Erstellende Pflegefachkraft</Label>
            <p className="text-sm">{getPflegefachkraefteDisplayName(record.fields.erstellende_pflegekraft)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Erstellungsdatum</Label>
            <p className="text-sm">{formatDate(record.fields.erstellungsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aktuelle pflegebedürftige Situation</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.pflegebeduerftige_situation ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorerkrankungen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.vorerkrankungen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Aktuelle Diagnosen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.aktuelle_diagnosen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ressourcen und Fähigkeiten</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.ressourcen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Risiken</Label>
            <p className="text-sm">{Array.isArray(record.fields.risiken) ? record.fields.risiken.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Pflegediagnosen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.pflegediagnosen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Pflegeziele</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.pflegeziele ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geplante Pflegemaßnahmen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.geplante_massnahmen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nächste Evaluation</Label>
            <p className="text-sm">{formatDate(record.fields.naechste_evaluation)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}