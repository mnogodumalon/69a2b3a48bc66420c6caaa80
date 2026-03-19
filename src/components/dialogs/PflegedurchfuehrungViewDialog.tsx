import type { Pflegedurchfuehrung, Klientenstammdaten, Tourenplanung, Pflegefachkraefte } from '@/types/app';
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

interface PflegedurchfuehrungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Pflegedurchfuehrung | null;
  onEdit: (record: Pflegedurchfuehrung) => void;
  klientenstammdatenList: Klientenstammdaten[];
  tourenplanungList: Tourenplanung[];
  pflegefachkraefteList: Pflegefachkraefte[];
}

export function PflegedurchfuehrungViewDialog({ open, onClose, record, onEdit, klientenstammdatenList, tourenplanungList, pflegefachkraefteList }: PflegedurchfuehrungViewDialogProps) {
  function getKlientenstammdatenDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return klientenstammdatenList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  function getTourenplanungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return tourenplanungList.find(r => r.record_id === id)?.fields.tourbezeichnung ?? '—';
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
          <DialogTitle>Pflegedurchführung anzeigen</DialogTitle>
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
            <Label className="text-xs text-muted-foreground">Tour</Label>
            <p className="text-sm">{getTourenplanungDisplayName(record.fields.tour)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Durchführende Pflegekraft</Label>
            <p className="text-sm">{getPflegefachkraefteDisplayName(record.fields.durchfuehrende_pflegekraft)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Besuchsdatum und -zeit</Label>
            <p className="text-sm">{formatDate(record.fields.besuchsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Leistungsart</Label>
            <p className="text-sm">{Array.isArray(record.fields.leistungsart) ? record.fields.leistungsart.map((v: any) => v?.label ?? v).join(', ') : '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dauer in Minuten</Label>
            <p className="text-sm">{record.fields.dauer_minuten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Pflegebericht</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.pflegebericht ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Besonderheiten und Auffälligkeiten</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.besonderheiten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Weitere Maßnahmen erforderlich</Label>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              record.fields.massnahmen_erforderlich ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {record.fields.massnahmen_erforderlich ? 'Ja' : 'Nein'}
            </span>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beschreibung weiterer Maßnahmen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.weitere_massnahmen ?? '—'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}