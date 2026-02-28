import { useState, useEffect, useRef, useCallback } from 'react';
import type { Klientenstammdaten } from '@/types/app';
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
import { Camera, CheckCircle2, FileText, ImagePlus, Loader2, Sparkles, Upload, X } from 'lucide-react';
import { fileToDataUri, extractFromPhoto } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

interface KlientenstammdatenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Klientenstammdaten['fields']) => Promise<void>;
  defaultValues?: Klientenstammdaten['fields'];
  enablePhotoScan?: boolean;
}

export function KlientenstammdatenDialog({ open, onClose, onSubmit, defaultValues, enablePhotoScan = false }: KlientenstammdatenDialogProps) {
  const [fields, setFields] = useState<Partial<Klientenstammdaten['fields']>>({});
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
      await onSubmit(fields as Klientenstammdaten['fields']);
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
      const schema = `{\n  "vorname": string | null, // Vorname\n  "nachname": string | null, // Nachname\n  "geburtsdatum": string | null, // YYYY-MM-DD // Geburtsdatum\n  "geschlecht": "weiblich" | "maennlich" | "divers" | null, // Geschlecht\n  "strasse": string | null, // Straße\n  "hausnummer": string | null, // Hausnummer\n  "postleitzahl": string | null, // Postleitzahl\n  "stadt": string | null, // Stadt\n  "telefon": string | null, // Telefonnummer\n  "mobil": string | null, // Mobilnummer\n  "email": string | null, // E-Mail-Adresse\n  "standort": string | null, // Wohnadresse (GPS)\n  "krankenversicherung": string | null, // Krankenversicherung\n  "versichertennummer": string | null, // Versichertennummer\n  "pflegegrad": "pflegegrad_1" | "pflegegrad_2" | "pflegegrad_3" | "pflegegrad_4" | "pflegegrad_5" | null, // Pflegegrad\n  "kostentraeger": string | null, // Kostenträger\n  "notfallkontakt_vorname": string | null, // Notfallkontakt Vorname\n  "notfallkontakt_nachname": string | null, // Notfallkontakt Nachname\n  "notfallkontakt_beziehung": string | null, // Beziehung zum Klienten\n  "notfallkontakt_telefon": string | null, // Notfallkontakt Telefon\n  "hausarzt_name": string | null, // Hausarzt Name\n  "hausarzt_telefon": string | null, // Hausarzt Telefon\n  "besonderheiten": string | null, // Besonderheiten\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        for (const [k, v] of Object.entries(raw)) {
          if (v != null) merged[k] = v;
        }
        return merged as Partial<Klientenstammdaten['fields']>;
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
          <DialogTitle>{defaultValues ? 'Klientenstammdaten bearbeiten' : 'Klientenstammdaten hinzufügen'}</DialogTitle>
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
            <Label htmlFor="vorname">Vorname</Label>
            <Input
              id="vorname"
              value={fields.vorname ?? ''}
              onChange={e => setFields(f => ({ ...f, vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nachname">Nachname</Label>
            <Input
              id="nachname"
              value={fields.nachname ?? ''}
              onChange={e => setFields(f => ({ ...f, nachname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="geburtsdatum">Geburtsdatum</Label>
            <Input
              id="geburtsdatum"
              type="date"
              value={fields.geburtsdatum ?? ''}
              onChange={e => setFields(f => ({ ...f, geburtsdatum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="geschlecht">Geschlecht</Label>
            <Select
              value={lookupKey(fields.geschlecht) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, geschlecht: v === 'none' ? undefined : v as 'weiblich' | 'maennlich' | 'divers' }))}
            >
              <SelectTrigger id="geschlecht"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="weiblich">Weiblich</SelectItem>
                <SelectItem value="maennlich">Männlich</SelectItem>
                <SelectItem value="divers">Divers</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="strasse">Straße</Label>
            <Input
              id="strasse"
              value={fields.strasse ?? ''}
              onChange={e => setFields(f => ({ ...f, strasse: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hausnummer">Hausnummer</Label>
            <Input
              id="hausnummer"
              value={fields.hausnummer ?? ''}
              onChange={e => setFields(f => ({ ...f, hausnummer: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postleitzahl">Postleitzahl</Label>
            <Input
              id="postleitzahl"
              value={fields.postleitzahl ?? ''}
              onChange={e => setFields(f => ({ ...f, postleitzahl: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stadt">Stadt</Label>
            <Input
              id="stadt"
              value={fields.stadt ?? ''}
              onChange={e => setFields(f => ({ ...f, stadt: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefon">Telefonnummer</Label>
            <Input
              id="telefon"
              value={fields.telefon ?? ''}
              onChange={e => setFields(f => ({ ...f, telefon: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobil">Mobilnummer</Label>
            <Input
              id="mobil"
              value={fields.mobil ?? ''}
              onChange={e => setFields(f => ({ ...f, mobil: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <Input
              id="email"
              type="email"
              value={fields.email ?? ''}
              onChange={e => setFields(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="standort">Wohnadresse (GPS)</Label>
            <Input
              id="standort"
              value={fields.standort ?? ''}
              onChange={e => setFields(f => ({ ...f, standort: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="krankenversicherung">Krankenversicherung</Label>
            <Input
              id="krankenversicherung"
              value={fields.krankenversicherung ?? ''}
              onChange={e => setFields(f => ({ ...f, krankenversicherung: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="versichertennummer">Versichertennummer</Label>
            <Input
              id="versichertennummer"
              value={fields.versichertennummer ?? ''}
              onChange={e => setFields(f => ({ ...f, versichertennummer: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pflegegrad">Pflegegrad</Label>
            <Select
              value={lookupKey(fields.pflegegrad) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, pflegegrad: v === 'none' ? undefined : v as 'pflegegrad_1' | 'pflegegrad_2' | 'pflegegrad_3' | 'pflegegrad_4' | 'pflegegrad_5' }))}
            >
              <SelectTrigger id="pflegegrad"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="pflegegrad_1">Pflegegrad 1</SelectItem>
                <SelectItem value="pflegegrad_2">Pflegegrad 2</SelectItem>
                <SelectItem value="pflegegrad_3">Pflegegrad 3</SelectItem>
                <SelectItem value="pflegegrad_4">Pflegegrad 4</SelectItem>
                <SelectItem value="pflegegrad_5">Pflegegrad 5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kostentraeger">Kostenträger</Label>
            <Input
              id="kostentraeger"
              value={fields.kostentraeger ?? ''}
              onChange={e => setFields(f => ({ ...f, kostentraeger: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notfallkontakt_vorname">Notfallkontakt Vorname</Label>
            <Input
              id="notfallkontakt_vorname"
              value={fields.notfallkontakt_vorname ?? ''}
              onChange={e => setFields(f => ({ ...f, notfallkontakt_vorname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notfallkontakt_nachname">Notfallkontakt Nachname</Label>
            <Input
              id="notfallkontakt_nachname"
              value={fields.notfallkontakt_nachname ?? ''}
              onChange={e => setFields(f => ({ ...f, notfallkontakt_nachname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notfallkontakt_beziehung">Beziehung zum Klienten</Label>
            <Input
              id="notfallkontakt_beziehung"
              value={fields.notfallkontakt_beziehung ?? ''}
              onChange={e => setFields(f => ({ ...f, notfallkontakt_beziehung: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notfallkontakt_telefon">Notfallkontakt Telefon</Label>
            <Input
              id="notfallkontakt_telefon"
              value={fields.notfallkontakt_telefon ?? ''}
              onChange={e => setFields(f => ({ ...f, notfallkontakt_telefon: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hausarzt_name">Hausarzt Name</Label>
            <Input
              id="hausarzt_name"
              value={fields.hausarzt_name ?? ''}
              onChange={e => setFields(f => ({ ...f, hausarzt_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hausarzt_telefon">Hausarzt Telefon</Label>
            <Input
              id="hausarzt_telefon"
              value={fields.hausarzt_telefon ?? ''}
              onChange={e => setFields(f => ({ ...f, hausarzt_telefon: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="besonderheiten">Besonderheiten</Label>
            <Textarea
              id="besonderheiten"
              value={fields.besonderheiten ?? ''}
              onChange={e => setFields(f => ({ ...f, besonderheiten: e.target.value }))}
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