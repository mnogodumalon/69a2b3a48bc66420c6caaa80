import { useState, useEffect, useRef, useCallback } from 'react';
import type { Wunddokumentation, Klientenstammdaten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl, uploadFile } from '@/services/livingAppsService';
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
import { fileToDataUri, extractFromPhoto, dataUriToBlob } from '@/lib/ai';
import { lookupKey, lookupKeys } from '@/lib/formatters';

interface WunddokumentationDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Wunddokumentation['fields']) => Promise<void>;
  defaultValues?: Wunddokumentation['fields'];
  klientenstammdatenList: Klientenstammdaten[];
  enablePhotoScan?: boolean;
}

export function WunddokumentationDialog({ open, onClose, onSubmit, defaultValues, klientenstammdatenList, enablePhotoScan = false }: WunddokumentationDialogProps) {
  const [fields, setFields] = useState<Partial<Wunddokumentation['fields']>>({});
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
      await onSubmit(fields as Wunddokumentation['fields']);
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
      const schema = `{\n  "klient": string | null, // Vor- und Nachname (z.B. "Jonas Schmidt")\n  "dokumentationsdatum": string | null, // YYYY-MM-DDTHH:MM // Dokumentationsdatum\n  "koerperregion": "kopf" | "hals" | "brust" | "bauch" | "ruecken" | "gesaess" | "linker_arm" | "rechter_arm" | null, // Körperregion\n  "genaue_lokalisation": string | null, // Genaue Lokalisation\n  "wundtyp": "dekubitus" | "ulcus_cruris" | "diabetisches_fusssyndrom" | "chirurgische_wunde" | "traumatische_wunde" | "sonstige" | null, // Wundtyp\n  "wundlaenge": number | null, // Wundlänge (cm)\n  "wundbreite": number | null, // Wundbreite (cm)\n  "wundtiefe": number | null, // Wundtiefe (cm)\n  "wundstadium": "grad_1" | "grad_2" | "grad_3" | "grad_4" | null, // Wundstadium (Dekubitus)\n  "wundzustand": string | null, // Wundzustand\n  "exsudat": "kein" | "gering" | "maessig" | "stark" | null, // Exsudatmenge\n  "geruch": boolean | null, // Geruchsbildung vorhanden\n  "durchgefuehrte_massnahmen": string | null, // Durchgeführte Maßnahmen\n  "verwendete_materialien": string | null, // Verwendete Materialien\n  "naechster_verbandwechsel": string | null, // YYYY-MM-DD // Nächster Verbandwechsel\n  "bemerkungen": string | null, // Bemerkungen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["klient"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const klientName = raw['klient'] as string | null;
        if (klientName) {
          const klientMatch = klientenstammdatenList.find(r => matchName(klientName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (klientMatch) merged['klient'] = createRecordUrl(APP_IDS.KLIENTENSTAMMDATEN, klientMatch.record_id);
        }
        return merged as Partial<Wunddokumentation['fields']>;
      });
      // Upload scanned file to file fields
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        try {
          const blob = dataUriToBlob(uri);
          const fileUrl = await uploadFile(blob, file.name);
          setFields(prev => ({ ...prev, wundfoto: fileUrl }));
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
        }
      }
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
          <DialogTitle>{defaultValues ? 'Wunddokumentation bearbeiten' : 'Wunddokumentation hinzufügen'}</DialogTitle>
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
            <Label htmlFor="dokumentationsdatum">Dokumentationsdatum</Label>
            <Input
              id="dokumentationsdatum"
              type="datetime-local"
              step="60"
              value={fields.dokumentationsdatum ?? ''}
              onChange={e => setFields(f => ({ ...f, dokumentationsdatum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="koerperregion">Körperregion</Label>
            <Select
              value={lookupKey(fields.koerperregion) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, koerperregion: v === 'none' ? undefined : v as 'kopf' | 'hals' | 'brust' | 'bauch' | 'ruecken' | 'gesaess' | 'linker_arm' | 'rechter_arm' | 'linkes_bein' | 'rechtes_bein' | 'linker_fuss' | 'rechter_fuss' }))}
            >
              <SelectTrigger id="koerperregion"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="kopf">Kopf</SelectItem>
                <SelectItem value="hals">Hals</SelectItem>
                <SelectItem value="brust">Brust</SelectItem>
                <SelectItem value="bauch">Bauch</SelectItem>
                <SelectItem value="ruecken">Rücken</SelectItem>
                <SelectItem value="gesaess">Gesäß</SelectItem>
                <SelectItem value="linker_arm">Linker Arm</SelectItem>
                <SelectItem value="rechter_arm">Rechter Arm</SelectItem>
                <SelectItem value="linkes_bein">Linkes Bein</SelectItem>
                <SelectItem value="rechtes_bein">Rechtes Bein</SelectItem>
                <SelectItem value="linker_fuss">Linker Fuß</SelectItem>
                <SelectItem value="rechter_fuss">Rechter Fuß</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="genaue_lokalisation">Genaue Lokalisation</Label>
            <Input
              id="genaue_lokalisation"
              value={fields.genaue_lokalisation ?? ''}
              onChange={e => setFields(f => ({ ...f, genaue_lokalisation: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wundtyp">Wundtyp</Label>
            <Select
              value={lookupKey(fields.wundtyp) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, wundtyp: v === 'none' ? undefined : v as 'dekubitus' | 'ulcus_cruris' | 'diabetisches_fusssyndrom' | 'chirurgische_wunde' | 'traumatische_wunde' | 'sonstige' }))}
            >
              <SelectTrigger id="wundtyp"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="dekubitus">Dekubitus</SelectItem>
                <SelectItem value="ulcus_cruris">Ulcus cruris</SelectItem>
                <SelectItem value="diabetisches_fusssyndrom">Diabetisches Fußsyndrom</SelectItem>
                <SelectItem value="chirurgische_wunde">Chirurgische Wunde</SelectItem>
                <SelectItem value="traumatische_wunde">Traumatische Wunde</SelectItem>
                <SelectItem value="sonstige">Sonstige</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wundlaenge">Wundlänge (cm)</Label>
            <Input
              id="wundlaenge"
              type="number"
              value={fields.wundlaenge ?? ''}
              onChange={e => setFields(f => ({ ...f, wundlaenge: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wundbreite">Wundbreite (cm)</Label>
            <Input
              id="wundbreite"
              type="number"
              value={fields.wundbreite ?? ''}
              onChange={e => setFields(f => ({ ...f, wundbreite: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wundtiefe">Wundtiefe (cm)</Label>
            <Input
              id="wundtiefe"
              type="number"
              value={fields.wundtiefe ?? ''}
              onChange={e => setFields(f => ({ ...f, wundtiefe: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wundstadium">Wundstadium (Dekubitus)</Label>
            <Select
              value={lookupKey(fields.wundstadium) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, wundstadium: v === 'none' ? undefined : v as 'grad_1' | 'grad_2' | 'grad_3' | 'grad_4' }))}
            >
              <SelectTrigger id="wundstadium"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="grad_1">Grad 1</SelectItem>
                <SelectItem value="grad_2">Grad 2</SelectItem>
                <SelectItem value="grad_3">Grad 3</SelectItem>
                <SelectItem value="grad_4">Grad 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wundzustand">Wundzustand</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wundzustand_sauber"
                  checked={lookupKeys(fields.wundzustand).includes('sauber')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.wundzustand);
                      const next = checked ? [...current, 'sauber'] : current.filter(k => k !== 'sauber');
                      return { ...f, wundzustand: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="wundzustand_sauber" className="font-normal">Sauber</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wundzustand_verschmutzt"
                  checked={lookupKeys(fields.wundzustand).includes('verschmutzt')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.wundzustand);
                      const next = checked ? [...current, 'verschmutzt'] : current.filter(k => k !== 'verschmutzt');
                      return { ...f, wundzustand: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="wundzustand_verschmutzt" className="font-normal">Verschmutzt</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wundzustand_nekrotisch"
                  checked={lookupKeys(fields.wundzustand).includes('nekrotisch')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.wundzustand);
                      const next = checked ? [...current, 'nekrotisch'] : current.filter(k => k !== 'nekrotisch');
                      return { ...f, wundzustand: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="wundzustand_nekrotisch" className="font-normal">Nekrotisch</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wundzustand_fibrinbelegt"
                  checked={lookupKeys(fields.wundzustand).includes('fibrinbelegt')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.wundzustand);
                      const next = checked ? [...current, 'fibrinbelegt'] : current.filter(k => k !== 'fibrinbelegt');
                      return { ...f, wundzustand: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="wundzustand_fibrinbelegt" className="font-normal">Fibrinbelegt</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wundzustand_granulierend"
                  checked={lookupKeys(fields.wundzustand).includes('granulierend')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.wundzustand);
                      const next = checked ? [...current, 'granulierend'] : current.filter(k => k !== 'granulierend');
                      return { ...f, wundzustand: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="wundzustand_granulierend" className="font-normal">Granulierend</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="wundzustand_epithelisierend"
                  checked={lookupKeys(fields.wundzustand).includes('epithelisierend')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.wundzustand);
                      const next = checked ? [...current, 'epithelisierend'] : current.filter(k => k !== 'epithelisierend');
                      return { ...f, wundzustand: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="wundzustand_epithelisierend" className="font-normal">Epithelisierend</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="exsudat">Exsudatmenge</Label>
            <Select
              value={lookupKey(fields.exsudat) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, exsudat: v === 'none' ? undefined : v as 'kein' | 'gering' | 'maessig' | 'stark' }))}
            >
              <SelectTrigger id="exsudat"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="kein">Kein Exsudat</SelectItem>
                <SelectItem value="gering">Gering</SelectItem>
                <SelectItem value="maessig">Mäßig</SelectItem>
                <SelectItem value="stark">Stark</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="geruch">Geruchsbildung vorhanden</Label>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox
                id="geruch"
                checked={!!fields.geruch}
                onCheckedChange={(v) => setFields(f => ({ ...f, geruch: !!v }))}
              />
              <Label htmlFor="geruch" className="font-normal">Geruchsbildung vorhanden</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wundfoto">Wundfoto</Label>
            {fields.wundfoto ? (
              <div className="flex items-center gap-3 rounded-lg border p-2">
                <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FileText size={20} className="text-muted-foreground" />
                  </div>
                  <img
                    src={fields.wundfoto}
                    alt=""
                    className="relative h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate text-foreground">{fields.wundfoto.split("/").pop()}</p>
                  <div className="flex gap-2 mt-1">
                    <label
                      className="text-xs text-primary hover:underline cursor-pointer"
                    >
                      Ändern
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const fileUrl = await uploadFile(file, file.name);
                            setFields(f => ({ ...f, wundfoto: fileUrl }));
                          } catch (err) { console.error('Upload failed:', err); }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setFields(f => ({ ...f, wundfoto: undefined }))}
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label
                className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              >
                <Upload size={20} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Datei hochladen</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const fileUrl = await uploadFile(file, file.name);
                      setFields(f => ({ ...f, wundfoto: fileUrl }));
                    } catch (err) { console.error('Upload failed:', err); }
                  }}
                />
              </label>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="durchgefuehrte_massnahmen">Durchgeführte Maßnahmen</Label>
            <Textarea
              id="durchgefuehrte_massnahmen"
              value={fields.durchgefuehrte_massnahmen ?? ''}
              onChange={e => setFields(f => ({ ...f, durchgefuehrte_massnahmen: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verwendete_materialien">Verwendete Materialien</Label>
            <Textarea
              id="verwendete_materialien"
              value={fields.verwendete_materialien ?? ''}
              onChange={e => setFields(f => ({ ...f, verwendete_materialien: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="naechster_verbandwechsel">Nächster Verbandwechsel</Label>
            <Input
              id="naechster_verbandwechsel"
              type="date"
              value={fields.naechster_verbandwechsel ?? ''}
              onChange={e => setFields(f => ({ ...f, naechster_verbandwechsel: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bemerkungen">Bemerkungen</Label>
            <Textarea
              id="bemerkungen"
              value={fields.bemerkungen ?? ''}
              onChange={e => setFields(f => ({ ...f, bemerkungen: e.target.value }))}
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