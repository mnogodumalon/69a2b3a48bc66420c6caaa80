import { useState, useEffect, useRef, useCallback } from 'react';
import type { Medikamentenplan, Klientenstammdaten } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile } from '@/services/livingAppsService';
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
import { fileToDataUri, extractFromPhoto, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey, lookupKeys } from '@/lib/formatters';

interface MedikamentenplanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Medikamentenplan['fields']) => Promise<void>;
  defaultValues?: Medikamentenplan['fields'];
  klientenstammdatenList: Klientenstammdaten[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

export function MedikamentenplanDialog({ open, onClose, onSubmit, defaultValues, klientenstammdatenList, enablePhotoScan = false, enablePhotoLocation = true }: MedikamentenplanDialogProps) {
  const [fields, setFields] = useState<Partial<Medikamentenplan['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFields(defaultValues ?? {});
      setPreview(null);
      setScanSuccess(false);
    }
  }, [open, defaultValues]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const clean = cleanFieldsForApi({ ...fields }, 'medikamentenplan');
      await onSubmit(clean as Medikamentenplan['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    setScanSuccess(false);
    try {
      const [uri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
      if (file.type.startsWith('image/')) setPreview(uri);
      const gps = enablePhotoLocation ? meta?.gps ?? null : null;
      const parts: string[] = [];
      let geoAddr = '';
      if (gps) {
        geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
        parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
        if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
      }
      if (meta?.dateTime) {
        parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="klient" entity="Klientenstammdaten">\n${JSON.stringify(klientenstammdatenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "klient": string | null, // Display name from Klientenstammdaten (see <available-records>)\n  "medikamentenname": string | null, // Medikamentenname\n  "wirkstoff": string | null, // Wirkstoff\n  "darreichungsform": LookupValue | null, // Darreichungsform (select one key: "tablette" | "kapsel" | "tropfen" | "salbe" | "injektion" | "pflaster" | "sonstiges") mapping: tablette=Tablette, kapsel=Kapsel, tropfen=Tropfen, salbe=Salbe, injektion=Injektion, pflaster=Pflaster, sonstiges=Sonstiges\n  "dosierung": string | null, // Dosierung\n  "einnahmezeiten": LookupValue[] | null, // Einnahmezeiten (select one or more keys: "morgens" | "mittags" | "abends" | "zur_nacht" | "bei_bedarf") mapping: morgens=Morgens, mittags=Mittags, abends=Abends, zur_nacht=Zur Nacht, bei_bedarf=Bei Bedarf\n  "einnahmehinweise": string | null, // Einnahmehinweise\n  "verordnungsdatum": string | null, // YYYY-MM-DD\n  "verordnender_arzt": string | null, // Verordnender Arzt\n  "bemerkungen": string | null, // Bemerkungen\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema, photoContext, DIALOG_INTENT);
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
        return merged as Partial<Medikamentenplan['fields']>;
      });
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
      alert(err instanceof Error ? err.message : String(err));
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

  const DIALOG_INTENT = defaultValues ? 'Medikamentenplan bearbeiten' : 'Medikamentenplan hinzufügen';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{DIALOG_INTENT}</DialogTitle>
        </DialogHeader>

        {enablePhotoScan && (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div>
              <div className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                KI-Assistent
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Versteht deine Fotos / Dokumente und füllt alles für dich aus</p>
            </div>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  KI-Assistent darf zusätzlich Informationen zu meiner Person verwenden
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? 'Lade...' : '(mehr Infos)'}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">Folgende Infos über dich können von der KI genutzt werden:</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">Profil konnte nicht geladen werden</span>
                )}
              </div>
            )}

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
                    <p className="text-sm font-medium">Foto oder Dokument hierher ziehen oder auswählen</p>
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
            <Label htmlFor="medikamentenname">Medikamentenname</Label>
            <Input
              id="medikamentenname"
              value={fields.medikamentenname ?? ''}
              onChange={e => setFields(f => ({ ...f, medikamentenname: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wirkstoff">Wirkstoff</Label>
            <Input
              id="wirkstoff"
              value={fields.wirkstoff ?? ''}
              onChange={e => setFields(f => ({ ...f, wirkstoff: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="darreichungsform">Darreichungsform</Label>
            <Select
              value={lookupKey(fields.darreichungsform) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, darreichungsform: v === 'none' ? undefined : v as any }))}
            >
              <SelectTrigger id="darreichungsform"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                <SelectItem value="tablette">Tablette</SelectItem>
                <SelectItem value="kapsel">Kapsel</SelectItem>
                <SelectItem value="tropfen">Tropfen</SelectItem>
                <SelectItem value="salbe">Salbe</SelectItem>
                <SelectItem value="injektion">Injektion</SelectItem>
                <SelectItem value="pflaster">Pflaster</SelectItem>
                <SelectItem value="sonstiges">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dosierung">Dosierung</Label>
            <Input
              id="dosierung"
              value={fields.dosierung ?? ''}
              onChange={e => setFields(f => ({ ...f, dosierung: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="einnahmezeiten">Einnahmezeiten</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="einnahmezeiten_morgens"
                  checked={lookupKeys(fields.einnahmezeiten).includes('morgens')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.einnahmezeiten);
                      const next = checked ? [...current, 'morgens'] : current.filter(k => k !== 'morgens');
                      return { ...f, einnahmezeiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="einnahmezeiten_morgens" className="font-normal">Morgens</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="einnahmezeiten_mittags"
                  checked={lookupKeys(fields.einnahmezeiten).includes('mittags')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.einnahmezeiten);
                      const next = checked ? [...current, 'mittags'] : current.filter(k => k !== 'mittags');
                      return { ...f, einnahmezeiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="einnahmezeiten_mittags" className="font-normal">Mittags</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="einnahmezeiten_abends"
                  checked={lookupKeys(fields.einnahmezeiten).includes('abends')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.einnahmezeiten);
                      const next = checked ? [...current, 'abends'] : current.filter(k => k !== 'abends');
                      return { ...f, einnahmezeiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="einnahmezeiten_abends" className="font-normal">Abends</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="einnahmezeiten_zur_nacht"
                  checked={lookupKeys(fields.einnahmezeiten).includes('zur_nacht')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.einnahmezeiten);
                      const next = checked ? [...current, 'zur_nacht'] : current.filter(k => k !== 'zur_nacht');
                      return { ...f, einnahmezeiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="einnahmezeiten_zur_nacht" className="font-normal">Zur Nacht</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="einnahmezeiten_bei_bedarf"
                  checked={lookupKeys(fields.einnahmezeiten).includes('bei_bedarf')}
                  onCheckedChange={(checked) => {
                    setFields(f => {
                      const current = lookupKeys(f.einnahmezeiten);
                      const next = checked ? [...current, 'bei_bedarf'] : current.filter(k => k !== 'bei_bedarf');
                      return { ...f, einnahmezeiten: next.length ? next as any : undefined };
                    });
                  }}
                />
                <Label htmlFor="einnahmezeiten_bei_bedarf" className="font-normal">Bei Bedarf</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="einnahmehinweise">Einnahmehinweise</Label>
            <Textarea
              id="einnahmehinweise"
              value={fields.einnahmehinweise ?? ''}
              onChange={e => setFields(f => ({ ...f, einnahmehinweise: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verordnungsdatum">Verordnungsdatum</Label>
            <Input
              id="verordnungsdatum"
              type="date"
              value={fields.verordnungsdatum ?? ''}
              onChange={e => setFields(f => ({ ...f, verordnungsdatum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verordnender_arzt">Verordnender Arzt</Label>
            <Input
              id="verordnender_arzt"
              value={fields.verordnender_arzt ?? ''}
              onChange={e => setFields(f => ({ ...f, verordnender_arzt: e.target.value }))}
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