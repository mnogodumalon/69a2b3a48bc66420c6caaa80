import { useState, useEffect } from 'react';
import type { Leistungsnachweis, Klientenstammdaten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface LeistungsnachweisDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Leistungsnachweis['fields']) => Promise<void>;
  defaultValues?: Leistungsnachweis['fields'];
  klientenstammdatenList: Klientenstammdaten[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function LeistungsnachweisDialog({ open, onClose, onSubmit, defaultValues, klientenstammdatenList, enablePhotoScan: _enablePhotoScan = false, enablePhotoLocation: _enablePhotoLocation = true }: LeistungsnachweisDialogProps) {
  const [fields, setFields] = useState<Partial<Leistungsnachweis['fields']>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const clean = cleanFieldsForApi({ ...fields }, 'leistungsnachweis');
      await onSubmit(clean as Leistungsnachweis['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const DIALOG_INTENT = defaultValues ? 'Leistungsnachweis bearbeiten' : 'Leistungsnachweis hinzufügen';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DIALOG_INTENT}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="klient">Klient</Label>
            <Select
              value={extractRecordId(fields.klient) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, klient: v === 'none' ? undefined : createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, v) }))}
            >
              <SelectTrigger id="klient"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {klientenstammdatenList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.vorname ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}