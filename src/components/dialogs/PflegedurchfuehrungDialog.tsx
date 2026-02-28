import { useState, useEffect, useRef, useCallback } from 'react';
import type { Pflegedurchfuehrung, Klientenstammdaten, Tourenplanung, Pflegefachkraefte } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, CheckCircle2, FileText, ImagePlus, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { fileToDataUri, extractFromPhoto } from '@/lib/ai';
import { lookupKeys } from '@/lib/formatters';

interface PflegedurchfuehrungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Pflegedurchfuehrung['fields']) => Promise<void>;
  defaultValues?: Pflegedurchfuehrung['fields'];
  klientenstammdatenList: Klientenstammdaten[];
  tourenplanungList: Tourenplanung[];
  pflegefachkraefteList: Pflegefachkraefte[];
  enablePhotoScan?: boolean;
}

export function PflegedurchfuehrungDialog({ open, onClose, onSubmit, defaultValues, klientenstammdatenList, tourenplanungList, pflegefachkraefteList, enablePhotoScan = false }: PflegedurchfuehrungDialogProps) {
  const [fields, setFields] = useState<Partial<Pflegedurchfuehrung['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFields(defaultValues ?? {});
      setPreview(null);
      setScanSuccess(false);
    }
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Pflegedurchfuehrung['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    setScanSuccess(false);
    try {
      const uri = await fileToDataUri(file);
      if (file.type.startsWith('image/')) setPreview(uri);
      const schema = `{\n  "klient": string | null, // Vor- und Nachname (z.B. "Jonas Schmidt")\n  "tour": string | null, // Name des Tourenplanung-Eintrags (z.B. "Jonas Schmidt")\n  "durchfuehrende_pflegekraft": string | null, // Vor- und Nachname (z.B. "Jonas Schmidt")\n  "besuchsdatum": string | null, // YYYY-MM-DDTHH:MM // Besuchsdatum und -zeit\n  "leistungsart": string | null, // Leistungsart\n  "dauer_minuten": number | null, // Dauer in Minuten\n  "pflegebericht": string | null, // Pflegebericht\n  "besonderheiten": string | null, // Besonderheiten und Auffälligkeiten\n  "massnahmen_erforderlich": boolean | null, // Weitere Maßnahmen erforderlich\n  "weitere_massnahmen": string | null, // Beschreibung weiterer Maßnahmen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["klient", "tour", "durchfuehrende_pflegekraft"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const klientName = raw['klient'] as string | null;
        if (klientName) {
          const klientMatch = klientenstammdatenList.find(r => matchName(klientName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (klientMatch) merged['klient'] = createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, klientMatch.record_id);
        }
        const tourName = raw['tour'] as string | null;
        if (tourName) {
          const tourMatch = tourenplanungList.find(r => matchName(tourName!, [String(r.fields.tourbezeichnung ?? '')]));
          if (tourMatch) merged['tour'] = createRecordUrl(APP_IDS.TOURENPLANUNG, tourMatch.record_id);
        }
        const durchfuehrende_pflegekraftName = raw['durchfuehrende_pflegekraft'] as string | null;
        if (durchfuehrende_pflegekraftName) {
          const durchfuehrende_pflegekraftMatch = pflegefachkraefteList.find(r => matchName(durchfuehrende_pflegekraftName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (durchfuehrende_pflegekraftMatch) merged['durchfuehrende_pflegekraft'] = createRecordUrl(APP_IDS.PFLEGEFACHKRAEFTE, durchfuehrende_pflegekraftMatch.record_id);
        }
        return merged as Partial<Pflegedurchfuehrung['fields']>;
      });
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handlePhotoScan(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handlePhotoScan(file);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Pflegedurchführung bearbeiten' : 'Pflegedurchführung hinzufügen'}</DialogTitle>
        </DialogHeader>

        {enablePhotoScan && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              KI-Erkennung
              <span className="text-muted-foreground font-normal">(füllt Felder automatisch aus)</span>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">KI analysiert...</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Felder werden automatisch ausgefüllt</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">Felder ausgefüllt!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Prüfe die Werte und passe sie ggf. an</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <ImagePlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Foto oder Dokument hochladen</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <Camera className="h-3.5 w-3.5 mr-1.5" />Kamera
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />Foto wählen
              </Button>
              <Button type="button" variant="outline" size="sm" className="flex-1 h-9 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <FileText className="h-3.5 w-3.5 mr-1.5" />Dokument
              </Button>
            </div>
          </div>
        )}

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
          <div className="space-y-2">
            <Label htmlFor="tour">Tour</Label>
            <Select
              value={extractRecordId(fields.tour) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, tour: v === 'none' ? undefined : createRecordUrl(APP_IDS.TOURENPLANUNG, v) }))}
            >
              <SelectTrigger id="tour"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {tourenplanungList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.tourbezeichnung ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="durchfuehrende_pflegekraft">Durchführende Pflegekraft</Label>
            <Select
              value={extractRecordId(fields.durchfuehrende_pflegekraft) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, durchfuehrende_pflegekraft: v === 'none' ? undefined : createRecordUrl(APP_IDS.PFLEGEFACHKRAEFTE, v) }))}
            >
              <SelectTrigger id="durchfuehrende_pflegekraft"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {pflegefachkraefteList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.vorname ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="besuchsdatum">Besuchsdatum und -zeit</Label>
            <Input
              id="besuchsdatum"
              type="datetime-local"
              step="60"
              value={fields.besuchsdatum ?? ''}
              onChange={e => setFields(f => ({ ...f, besuchsdatum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leistungsart">Leistungsart</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="leistungsart_grundpflege"
                  checked={lookupKeys(fields.leistungsart).includes('grundpflege')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.leistungsart);
                      const next = checked ? [...current, 'grundpflege'] : current.filter(k => k !== 'grundpflege');
                      return { ...f, leistungsart: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="leistungsart_grundpflege" className="font-normal">Grundpflege</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="leistungsart_behandlungspflege"
                  checked={lookupKeys(fields.leistungsart).includes('behandlungspflege')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.leistungsart);
                      const next = checked ? [...current, 'behandlungspflege'] : current.filter(k => k !== 'behandlungspflege');
                      return { ...f, leistungsart: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="leistungsart_behandlungspflege" className="font-normal">Behandlungspflege</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="leistungsart_hauswirtschaft"
                  checked={lookupKeys(fields.leistungsart).includes('hauswirtschaft')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.leistungsart);
                      const next = checked ? [...current, 'hauswirtschaft'] : current.filter(k => k !== 'hauswirtschaft');
                      return { ...f, leistungsart: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="leistungsart_hauswirtschaft" className="font-normal">Hauswirtschaftliche Versorgung</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="leistungsart_betreuung"
                  checked={lookupKeys(fields.leistungsart).includes('betreuung')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.leistungsart);
                      const next = checked ? [...current, 'betreuung'] : current.filter(k => k !== 'betreuung');
                      return { ...f, leistungsart: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="leistungsart_betreuung" className="font-normal">Betreuungsleistungen</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="leistungsart_medikamentengabe"
                  checked={lookupKeys(fields.leistungsart).includes('medikamentengabe')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.leistungsart);
                      const next = checked ? [...current, 'medikamentengabe'] : current.filter(k => k !== 'medikamentengabe');
                      return { ...f, leistungsart: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="leistungsart_medikamentengabe" className="font-normal">Medikamentengabe</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="leistungsart_verbandwechsel"
                  checked={lookupKeys(fields.leistungsart).includes('verbandwechsel')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.leistungsart);
                      const next = checked ? [...current, 'verbandwechsel'] : current.filter(k => k !== 'verbandwechsel');
                      return { ...f, leistungsart: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="leistungsart_verbandwechsel" className="font-normal">Verbandwechsel</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="leistungsart_mobilisation"
                  checked={lookupKeys(fields.leistungsart).includes('mobilisation')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.leistungsart);
                      const next = checked ? [...current, 'mobilisation'] : current.filter(k => k !== 'mobilisation');
                      return { ...f, leistungsart: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="leistungsart_mobilisation" className="font-normal">Mobilisation</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dauer_minuten">Dauer in Minuten</Label>
            <Input
              id="dauer_minuten"
              type="number"
              value={fields.dauer_minuten ?? ''}
              onChange={e => setFields(f => ({ ...f, dauer_minuten: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pflegebericht">Pflegebericht</Label>
            <Textarea
              id="pflegebericht"
              value={fields.pflegebericht ?? ''}
              onChange={e => setFields(f => ({ ...f, pflegebericht: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="besonderheiten">Besonderheiten und Auffälligkeiten</Label>
            <Textarea
              id="besonderheiten"
              value={fields.besonderheiten ?? ''}
              onChange={e => setFields(f => ({ ...f, besonderheiten: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="massnahmen_erforderlich">Weitere Maßnahmen erforderlich</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="massnahmen_erforderlich"
                checked={!!fields.massnahmen_erforderlich}
                onCheckedChange={(v) => setFields(f => ({ ...f, massnahmen_erforderlich: !!v }))}
              />
              <Label htmlFor="massnahmen_erforderlich" className="font-normal">Weitere Maßnahmen erforderlich</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weitere_massnahmen">Beschreibung weiterer Maßnahmen</Label>
            <Textarea
              id="weitere_massnahmen"
              value={fields.weitere_massnahmen ?? ''}
              onChange={e => setFields(f => ({ ...f, weitere_massnahmen: e.target.value }))}
              rows={3}
            />
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