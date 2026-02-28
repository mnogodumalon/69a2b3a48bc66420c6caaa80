import { useState, useEffect, useRef, useCallback } from 'react';
import type { Pflegeplanung, Klientenstammdaten, Pflegefachkraefte } from '@/types/app';
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

interface PflegeplanungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Pflegeplanung['fields']) => Promise<void>;
  defaultValues?: Pflegeplanung['fields'];
  klientenstammdatenList: Klientenstammdaten[];
  pflegefachkraefteList: Pflegefachkraefte[];
  enablePhotoScan?: boolean;
}

export function PflegeplanungDialog({ open, onClose, onSubmit, defaultValues, klientenstammdatenList, pflegefachkraefteList, enablePhotoScan = false }: PflegeplanungDialogProps) {
  const [fields, setFields] = useState<Partial<Pflegeplanung['fields']>>({});
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
      await onSubmit(fields as Pflegeplanung['fields']);
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
      const schema = `{\n  "klient": string | null, // Vor- und Nachname (z.B. "Jonas Schmidt")\n  "erstellende_pflegekraft": string | null, // Vor- und Nachname (z.B. "Jonas Schmidt")\n  "erstellungsdatum": string | null, // YYYY-MM-DD // Erstellungsdatum\n  "pflegebeduerftige_situation": string | null, // Aktuelle pflegebedürftige Situation\n  "vorerkrankungen": string | null, // Vorerkrankungen\n  "aktuelle_diagnosen": string | null, // Aktuelle Diagnosen\n  "ressourcen": string | null, // Ressourcen und Fähigkeiten\n  "risiken": string | null, // Risiken\n  "pflegediagnosen": string | null, // Pflegediagnosen\n  "pflegeziele": string | null, // Pflegeziele\n  "geplante_massnahmen": string | null, // Geplante Pflegemaßnahmen\n  "naechste_evaluation": string | null, // YYYY-MM-DD // Nächste Evaluation\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["klient", "erstellende_pflegekraft"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const klientName = raw['klient'] as string | null;
        if (klientName) {
          const klientMatch = klientenstammdatenList.find(r => matchName(klientName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (klientMatch) merged['klient'] = createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, klientMatch.record_id);
        }
        const erstellende_pflegekraftName = raw['erstellende_pflegekraft'] as string | null;
        if (erstellende_pflegekraftName) {
          const erstellende_pflegekraftMatch = pflegefachkraefteList.find(r => matchName(erstellende_pflegekraftName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (erstellende_pflegekraftMatch) merged['erstellende_pflegekraft'] = createRecordUrl(APP_IDS.PFLEGEFACHKRAEFTE, erstellende_pflegekraftMatch.record_id);
        }
        return merged as Partial<Pflegeplanung['fields']>;
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
          <DialogTitle>{defaultValues ? 'Pflegeplanung bearbeiten' : 'Pflegeplanung hinzufügen'}</DialogTitle>
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
            <Label htmlFor="erstellende_pflegekraft">Erstellende Pflegefachkraft</Label>
            <Select
              value={extractRecordId(fields.erstellende_pflegekraft) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, erstellende_pflegekraft: v === 'none' ? undefined : createRecordUrl(APP_IDS.PFLEGEFACHKRAEFTE, v) }))}
            >
              <SelectTrigger id="erstellende_pflegekraft"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
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
            <Label htmlFor="erstellungsdatum">Erstellungsdatum</Label>
            <Input
              id="erstellungsdatum"
              type="date"
              value={fields.erstellungsdatum ?? ''}
              onChange={e => setFields(f => ({ ...f, erstellungsdatum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pflegebeduerftige_situation">Aktuelle pflegebedürftige Situation</Label>
            <Textarea
              id="pflegebeduerftige_situation"
              value={fields.pflegebeduerftige_situation ?? ''}
              onChange={e => setFields(f => ({ ...f, pflegebeduerftige_situation: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vorerkrankungen">Vorerkrankungen</Label>
            <Textarea
              id="vorerkrankungen"
              value={fields.vorerkrankungen ?? ''}
              onChange={e => setFields(f => ({ ...f, vorerkrankungen: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="aktuelle_diagnosen">Aktuelle Diagnosen</Label>
            <Textarea
              id="aktuelle_diagnosen"
              value={fields.aktuelle_diagnosen ?? ''}
              onChange={e => setFields(f => ({ ...f, aktuelle_diagnosen: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ressourcen">Ressourcen und Fähigkeiten</Label>
            <Textarea
              id="ressourcen"
              value={fields.ressourcen ?? ''}
              onChange={e => setFields(f => ({ ...f, ressourcen: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risiken">Risiken</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risiken_dekubitusgefahr"
                  checked={lookupKeys(fields.risiken).includes('dekubitusgefahr')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risiken);
                      const next = checked ? [...current, 'dekubitusgefahr'] : current.filter(k => k !== 'dekubitusgefahr');
                      return { ...f, risiken: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risiken_dekubitusgefahr" className="font-normal">Dekubitusgefahr</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risiken_mangelernaehrung"
                  checked={lookupKeys(fields.risiken).includes('mangelernaehrung')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risiken);
                      const next = checked ? [...current, 'mangelernaehrung'] : current.filter(k => k !== 'mangelernaehrung');
                      return { ...f, risiken: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risiken_mangelernaehrung" className="font-normal">Mangelernährung</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risiken_dehydratation"
                  checked={lookupKeys(fields.risiken).includes('dehydratation')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risiken);
                      const next = checked ? [...current, 'dehydratation'] : current.filter(k => k !== 'dehydratation');
                      return { ...f, risiken: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risiken_dehydratation" className="font-normal">Dehydratation</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risiken_kontrakturgefahr"
                  checked={lookupKeys(fields.risiken).includes('kontrakturgefahr')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risiken);
                      const next = checked ? [...current, 'kontrakturgefahr'] : current.filter(k => k !== 'kontrakturgefahr');
                      return { ...f, risiken: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risiken_kontrakturgefahr" className="font-normal">Kontrakturgefahr</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risiken_aspirationsgefahr"
                  checked={lookupKeys(fields.risiken).includes('aspirationsgefahr')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risiken);
                      const next = checked ? [...current, 'aspirationsgefahr'] : current.filter(k => k !== 'aspirationsgefahr');
                      return { ...f, risiken: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risiken_aspirationsgefahr" className="font-normal">Aspirationsgefahr</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risiken_sturzgefahr"
                  checked={lookupKeys(fields.risiken).includes('sturzgefahr')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.risiken);
                      const next = checked ? [...current, 'sturzgefahr'] : current.filter(k => k !== 'sturzgefahr');
                      return { ...f, risiken: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="risiken_sturzgefahr" className="font-normal">Sturzgefahr</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pflegediagnosen">Pflegediagnosen</Label>
            <Textarea
              id="pflegediagnosen"
              value={fields.pflegediagnosen ?? ''}
              onChange={e => setFields(f => ({ ...f, pflegediagnosen: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pflegeziele">Pflegeziele</Label>
            <Textarea
              id="pflegeziele"
              value={fields.pflegeziele ?? ''}
              onChange={e => setFields(f => ({ ...f, pflegeziele: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="geplante_massnahmen">Geplante Pflegemaßnahmen</Label>
            <Textarea
              id="geplante_massnahmen"
              value={fields.geplante_massnahmen ?? ''}
              onChange={e => setFields(f => ({ ...f, geplante_massnahmen: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="naechste_evaluation">Nächste Evaluation</Label>
            <Input
              id="naechste_evaluation"
              type="date"
              value={fields.naechste_evaluation ?? ''}
              onChange={e => setFields(f => ({ ...f, naechste_evaluation: e.target.value }))}
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