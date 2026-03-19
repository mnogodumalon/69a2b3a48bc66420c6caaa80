import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { Medikamentenplan, Klientenstammdaten, Wunddokumentation, VitalwerteErfassung, Tourenplanung, Pflegeplanung, Leistungsnachweis, Pflegedurchfuehrung, Pflegefachkraefte } from '@/types/app';
import { LivingAppsService, extractRecordId, cleanFieldsForApi } from '@/services/livingAppsService';
import { MedikamentenplanDialog } from '@/components/dialogs/MedikamentenplanDialog';
import { MedikamentenplanViewDialog } from '@/components/dialogs/MedikamentenplanViewDialog';
import { KlientenstammdatenDialog } from '@/components/dialogs/KlientenstammdatenDialog';
import { KlientenstammdatenViewDialog } from '@/components/dialogs/KlientenstammdatenViewDialog';
import { WunddokumentationDialog } from '@/components/dialogs/WunddokumentationDialog';
import { WunddokumentationViewDialog } from '@/components/dialogs/WunddokumentationViewDialog';
import { VitalwerteErfassungDialog } from '@/components/dialogs/VitalwerteErfassungDialog';
import { VitalwerteErfassungViewDialog } from '@/components/dialogs/VitalwerteErfassungViewDialog';
import { TourenplanungDialog } from '@/components/dialogs/TourenplanungDialog';
import { TourenplanungViewDialog } from '@/components/dialogs/TourenplanungViewDialog';
import { PflegeplanungDialog } from '@/components/dialogs/PflegeplanungDialog';
import { PflegeplanungViewDialog } from '@/components/dialogs/PflegeplanungViewDialog';
import { LeistungsnachweisDialog } from '@/components/dialogs/LeistungsnachweisDialog';
import { LeistungsnachweisViewDialog } from '@/components/dialogs/LeistungsnachweisViewDialog';
import { PflegedurchfuehrungDialog } from '@/components/dialogs/PflegedurchfuehrungDialog';
import { PflegedurchfuehrungViewDialog } from '@/components/dialogs/PflegedurchfuehrungViewDialog';
import { PflegefachkraefteDialog } from '@/components/dialogs/PflegefachkraefteDialog';
import { PflegefachkraefteViewDialog } from '@/components/dialogs/PflegefachkraefteViewDialog';
import { BulkEditDialog } from '@/components/dialogs/BulkEditDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Plus, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Search, Copy, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

// Field metadata per entity for bulk edit and column filters
const MEDIKAMENTENPLAN_FIELDS = [
  { key: 'klient', label: 'Klient', type: 'applookup/select', targetEntity: 'klientenstammdaten', targetAppId: 'KLIENTENSTAMMDATEN', displayField: 'vorname' },
  { key: 'medikamentenname', label: 'Medikamentenname', type: 'string/text' },
  { key: 'wirkstoff', label: 'Wirkstoff', type: 'string/text' },
  { key: 'darreichungsform', label: 'Darreichungsform', type: 'lookup/select', options: [{ key: 'tablette', label: 'Tablette' }, { key: 'kapsel', label: 'Kapsel' }, { key: 'tropfen', label: 'Tropfen' }, { key: 'salbe', label: 'Salbe' }, { key: 'injektion', label: 'Injektion' }, { key: 'pflaster', label: 'Pflaster' }, { key: 'sonstiges', label: 'Sonstiges' }] },
  { key: 'dosierung', label: 'Dosierung', type: 'string/text' },
  { key: 'einnahmezeiten', label: 'Einnahmezeiten', type: 'multiplelookup/checkbox', options: [{ key: 'morgens', label: 'Morgens' }, { key: 'mittags', label: 'Mittags' }, { key: 'abends', label: 'Abends' }, { key: 'zur_nacht', label: 'Zur Nacht' }, { key: 'bei_bedarf', label: 'Bei Bedarf' }] },
  { key: 'einnahmehinweise', label: 'Einnahmehinweise', type: 'string/textarea' },
  { key: 'verordnungsdatum', label: 'Verordnungsdatum', type: 'date/date' },
  { key: 'verordnender_arzt', label: 'Verordnender Arzt', type: 'string/text' },
  { key: 'bemerkungen', label: 'Bemerkungen', type: 'string/textarea' },
];
const KLIENTENSTAMMDATEN_FIELDS = [
  { key: 'vorname', label: 'Vorname', type: 'string/text' },
  { key: 'nachname', label: 'Nachname', type: 'string/text' },
  { key: 'geburtsdatum', label: 'Geburtsdatum', type: 'date/date' },
  { key: 'geschlecht', label: 'Geschlecht', type: 'lookup/select', options: [{ key: 'weiblich', label: 'Weiblich' }, { key: 'maennlich', label: 'Männlich' }, { key: 'divers', label: 'Divers' }] },
  { key: 'strasse', label: 'Straße', type: 'string/text' },
  { key: 'hausnummer', label: 'Hausnummer', type: 'string/text' },
  { key: 'postleitzahl', label: 'Postleitzahl', type: 'string/text' },
  { key: 'stadt', label: 'Stadt', type: 'string/text' },
  { key: 'telefon', label: 'Telefonnummer', type: 'string/tel' },
  { key: 'mobil', label: 'Mobilnummer', type: 'string/tel' },
  { key: 'email', label: 'E-Mail-Adresse', type: 'string/email' },
  { key: 'standort', label: 'Wohnadresse (GPS)', type: 'geo' },
  { key: 'krankenversicherung', label: 'Krankenversicherung', type: 'string/text' },
  { key: 'versichertennummer', label: 'Versichertennummer', type: 'string/text' },
  { key: 'pflegegrad', label: 'Pflegegrad', type: 'lookup/select', options: [{ key: 'pflegegrad_1', label: 'Pflegegrad 1' }, { key: 'pflegegrad_2', label: 'Pflegegrad 2' }, { key: 'pflegegrad_3', label: 'Pflegegrad 3' }, { key: 'pflegegrad_4', label: 'Pflegegrad 4' }, { key: 'pflegegrad_5', label: 'Pflegegrad 5' }] },
  { key: 'kostentraeger', label: 'Kostenträger', type: 'string/text' },
  { key: 'notfallkontakt_vorname', label: 'Notfallkontakt Vorname', type: 'string/text' },
  { key: 'notfallkontakt_nachname', label: 'Notfallkontakt Nachname', type: 'string/text' },
  { key: 'notfallkontakt_beziehung', label: 'Beziehung zum Klienten', type: 'string/text' },
  { key: 'notfallkontakt_telefon', label: 'Notfallkontakt Telefon', type: 'string/tel' },
  { key: 'hausarzt_name', label: 'Hausarzt Name', type: 'string/text' },
  { key: 'hausarzt_telefon', label: 'Hausarzt Telefon', type: 'string/tel' },
  { key: 'besonderheiten', label: 'Besonderheiten', type: 'string/textarea' },
];
const WUNDDOKUMENTATION_FIELDS = [
  { key: 'dokumentationsdatum', label: 'Dokumentationsdatum', type: 'date/datetimeminute' },
  { key: 'koerperregion', label: 'Körperregion', type: 'lookup/select', options: [{ key: 'kopf', label: 'Kopf' }, { key: 'hals', label: 'Hals' }, { key: 'brust', label: 'Brust' }, { key: 'bauch', label: 'Bauch' }, { key: 'ruecken', label: 'Rücken' }, { key: 'gesaess', label: 'Gesäß' }, { key: 'linker_arm', label: 'Linker Arm' }, { key: 'rechter_arm', label: 'Rechter Arm' }, { key: 'linkes_bein', label: 'Linkes Bein' }, { key: 'rechtes_bein', label: 'Rechtes Bein' }, { key: 'linker_fuss', label: 'Linker Fuß' }, { key: 'rechter_fuss', label: 'Rechter Fuß' }] },
  { key: 'genaue_lokalisation', label: 'Genaue Lokalisation', type: 'string/text' },
  { key: 'wundtyp', label: 'Wundtyp', type: 'lookup/select', options: [{ key: 'dekubitus', label: 'Dekubitus' }, { key: 'ulcus_cruris', label: 'Ulcus cruris' }, { key: 'diabetisches_fusssyndrom', label: 'Diabetisches Fußsyndrom' }, { key: 'chirurgische_wunde', label: 'Chirurgische Wunde' }, { key: 'traumatische_wunde', label: 'Traumatische Wunde' }, { key: 'sonstige', label: 'Sonstige' }] },
  { key: 'wundbreite', label: 'Wundbreite (cm)', type: 'number' },
  { key: 'wundtiefe', label: 'Wundtiefe (cm)', type: 'number' },
  { key: 'wundstadium', label: 'Wundstadium (Dekubitus)', type: 'lookup/select', options: [{ key: 'grad_1', label: 'Grad 1' }, { key: 'grad_2', label: 'Grad 2' }, { key: 'grad_3', label: 'Grad 3' }, { key: 'grad_4', label: 'Grad 4' }] },
  { key: 'wundzustand', label: 'Wundzustand', type: 'multiplelookup/checkbox', options: [{ key: 'sauber', label: 'Sauber' }, { key: 'verschmutzt', label: 'Verschmutzt' }, { key: 'nekrotisch', label: 'Nekrotisch' }, { key: 'fibrinbelegt', label: 'Fibrinbelegt' }, { key: 'granulierend', label: 'Granulierend' }, { key: 'epithelisierend', label: 'Epithelisierend' }] },
  { key: 'exsudat', label: 'Exsudatmenge', type: 'lookup/select', options: [{ key: 'kein', label: 'Kein Exsudat' }, { key: 'gering', label: 'Gering' }, { key: 'maessig', label: 'Mäßig' }, { key: 'stark', label: 'Stark' }] },
  { key: 'geruch', label: 'Geruchsbildung vorhanden', type: 'bool' },
  { key: 'wundfoto', label: 'Wundfoto', type: 'file' },
  { key: 'durchgefuehrte_massnahmen', label: 'Durchgeführte Maßnahmen', type: 'string/textarea' },
  { key: 'verwendete_materialien', label: 'Verwendete Materialien', type: 'string/textarea' },
  { key: 'naechster_verbandwechsel', label: 'Nächster Verbandwechsel', type: 'date/date' },
  { key: 'bemerkungen', label: 'Bemerkungen', type: 'string/textarea' },
  { key: 'klient', label: 'Klient', type: 'applookup/select', targetEntity: 'klientenstammdaten', targetAppId: 'KLIENTENSTAMMDATEN', displayField: 'vorname' },
  { key: 'wundlaenge', label: 'Wundlänge (cm)', type: 'number' },
];
const VITALWERTEERFASSUNG_FIELDS = [
  { key: 'klient', label: 'Klient', type: 'applookup/select', targetEntity: 'klientenstammdaten', targetAppId: 'KLIENTENSTAMMDATEN', displayField: 'vorname' },
  { key: 'messzeitpunkt', label: 'Messzeitpunkt', type: 'date/datetimeminute' },
  { key: 'blutdruck_systolisch', label: 'Blutdruck systolisch (mmHg)', type: 'number' },
  { key: 'blutdruck_diastolisch', label: 'Blutdruck diastolisch (mmHg)', type: 'number' },
  { key: 'puls', label: 'Puls (Schläge/min)', type: 'number' },
  { key: 'temperatur', label: 'Körpertemperatur (°C)', type: 'number' },
  { key: 'gewicht', label: 'Gewicht (kg)', type: 'number' },
  { key: 'blutzucker', label: 'Blutzucker (mg/dl)', type: 'number' },
  { key: 'sauerstoffsaettigung', label: 'Sauerstoffsättigung (%)', type: 'number' },
  { key: 'atemfrequenz', label: 'Atemfrequenz (Atemzüge/min)', type: 'number' },
  { key: 'messgeraet', label: 'Verwendetes Messgerät', type: 'string/text' },
  { key: 'bemerkungen', label: 'Bemerkungen', type: 'string/textarea' },
];
const TOURENPLANUNG_FIELDS = [
  { key: 'tourdatum', label: 'Tourdatum', type: 'date/date' },
  { key: 'tourbezeichnung', label: 'Tourbezeichnung', type: 'string/text' },
  { key: 'zugeordnete_pflegekraefte', label: 'Zugeordnete Pflegekräfte', type: 'multipleapplookup/select', targetEntity: 'pflegefachkraefte', targetAppId: 'PFLEGEFACHKRAEFTE', displayField: 'vorname' },
  { key: 'klienten', label: 'Klienten auf der Tour', type: 'multipleapplookup/select', targetEntity: 'klientenstammdaten', targetAppId: 'KLIENTENSTAMMDATEN', displayField: 'vorname' },
  { key: 'startzeit', label: 'Startzeit', type: 'string/text' },
  { key: 'endzeit', label: 'Geplante Endzeit', type: 'string/text' },
  { key: 'notfaelle', label: 'Notfall-Tour', type: 'bool' },
  { key: 'bemerkungen', label: 'Bemerkungen zur Tour', type: 'string/textarea' },
];
const PFLEGEPLANUNG_FIELDS = [
  { key: 'klient', label: 'Klient', type: 'applookup/select', targetEntity: 'klientenstammdaten', targetAppId: 'KLIENTENSTAMMDATEN', displayField: 'vorname' },
  { key: 'erstellende_pflegekraft', label: 'Erstellende Pflegefachkraft', type: 'applookup/select', targetEntity: 'pflegefachkraefte', targetAppId: 'PFLEGEFACHKRAEFTE', displayField: 'vorname' },
  { key: 'erstellungsdatum', label: 'Erstellungsdatum', type: 'date/date' },
  { key: 'pflegebeduerftige_situation', label: 'Aktuelle pflegebedürftige Situation', type: 'string/textarea' },
  { key: 'vorerkrankungen', label: 'Vorerkrankungen', type: 'string/textarea' },
  { key: 'aktuelle_diagnosen', label: 'Aktuelle Diagnosen', type: 'string/textarea' },
  { key: 'ressourcen', label: 'Ressourcen und Fähigkeiten', type: 'string/textarea' },
  { key: 'risiken', label: 'Risiken', type: 'multiplelookup/checkbox', options: [{ key: 'dekubitusgefahr', label: 'Dekubitusgefahr' }, { key: 'mangelernaehrung', label: 'Mangelernährung' }, { key: 'dehydratation', label: 'Dehydratation' }, { key: 'kontrakturgefahr', label: 'Kontrakturgefahr' }, { key: 'aspirationsgefahr', label: 'Aspirationsgefahr' }, { key: 'sturzgefahr', label: 'Sturzgefahr' }] },
  { key: 'pflegediagnosen', label: 'Pflegediagnosen', type: 'string/textarea' },
  { key: 'pflegeziele', label: 'Pflegeziele', type: 'string/textarea' },
  { key: 'geplante_massnahmen', label: 'Geplante Pflegemaßnahmen', type: 'string/textarea' },
  { key: 'naechste_evaluation', label: 'Nächste Evaluation', type: 'date/date' },
];
const LEISTUNGSNACHWEIS_FIELDS = [
  { key: 'klient', label: 'Klient', type: 'applookup/select', targetEntity: 'klientenstammdaten', targetAppId: 'KLIENTENSTAMMDATEN', displayField: 'vorname' },
];
const PFLEGEDURCHFUEHRUNG_FIELDS = [
  { key: 'klient', label: 'Klient', type: 'applookup/select', targetEntity: 'klientenstammdaten', targetAppId: 'KLIENTENSTAMMDATEN', displayField: 'vorname' },
  { key: 'tour', label: 'Tour', type: 'applookup/select', targetEntity: 'tourenplanung', targetAppId: 'TOURENPLANUNG', displayField: 'tourbezeichnung' },
  { key: 'durchfuehrende_pflegekraft', label: 'Durchführende Pflegekraft', type: 'applookup/select', targetEntity: 'pflegefachkraefte', targetAppId: 'PFLEGEFACHKRAEFTE', displayField: 'vorname' },
  { key: 'besuchsdatum', label: 'Besuchsdatum und -zeit', type: 'date/datetimeminute' },
  { key: 'leistungsart', label: 'Leistungsart', type: 'multiplelookup/checkbox', options: [{ key: 'grundpflege', label: 'Grundpflege' }, { key: 'behandlungspflege', label: 'Behandlungspflege' }, { key: 'hauswirtschaft', label: 'Hauswirtschaftliche Versorgung' }, { key: 'betreuung', label: 'Betreuungsleistungen' }, { key: 'medikamentengabe', label: 'Medikamentengabe' }, { key: 'verbandwechsel', label: 'Verbandwechsel' }, { key: 'mobilisation', label: 'Mobilisation' }] },
  { key: 'dauer_minuten', label: 'Dauer in Minuten', type: 'number' },
  { key: 'pflegebericht', label: 'Pflegebericht', type: 'string/textarea' },
  { key: 'besonderheiten', label: 'Besonderheiten und Auffälligkeiten', type: 'string/textarea' },
  { key: 'massnahmen_erforderlich', label: 'Weitere Maßnahmen erforderlich', type: 'bool' },
  { key: 'weitere_massnahmen', label: 'Beschreibung weiterer Maßnahmen', type: 'string/textarea' },
];
const PFLEGEFACHKRAEFTE_FIELDS = [
  { key: 'vorname', label: 'Vorname', type: 'string/text' },
  { key: 'nachname', label: 'Nachname', type: 'string/text' },
  { key: 'geburtsdatum', label: 'Geburtsdatum', type: 'date/date' },
  { key: 'qualifikation', label: 'Qualifikation', type: 'lookup/select', options: [{ key: 'pflegefachkraft', label: 'Examinierte Pflegefachkraft' }, { key: 'pflegehilfskraft', label: 'Pflegehilfskraft' }, { key: 'krankenpfleger', label: 'Gesundheits- und Krankenpfleger/in' }, { key: 'altenpfleger', label: 'Altenpfleger/in' }, { key: 'pflegedienstleitung', label: 'Pflegedienstleitung' }] },
  { key: 'rolle', label: 'Rolle im System', type: 'lookup/select', options: [{ key: 'rolle_fachkraft', label: 'Pflegefachkraft (Planung/Anamnese)' }, { key: 'rolle_hilfskraft', label: 'Pflegehilfskraft (Durchführung)' }, { key: 'rolle_verwaltung', label: 'Verwaltung (Abrechnung)' }] },
  { key: 'personalnummer', label: 'Personalnummer', type: 'string/text' },
  { key: 'telefon', label: 'Telefonnummer', type: 'string/tel' },
  { key: 'email', label: 'E-Mail-Adresse', type: 'string/email' },
  { key: 'aktiv', label: 'Aktiv im Dienst', type: 'bool' },
];

const ENTITY_TABS = [
  { key: 'medikamentenplan', label: 'Medikamentenplan', pascal: 'Medikamentenplan' },
  { key: 'klientenstammdaten', label: 'Klientenstammdaten', pascal: 'Klientenstammdaten' },
  { key: 'wunddokumentation', label: 'Wunddokumentation', pascal: 'Wunddokumentation' },
  { key: 'vitalwerte_erfassung', label: 'Vitalwerte-Erfassung', pascal: 'VitalwerteErfassung' },
  { key: 'tourenplanung', label: 'Tourenplanung', pascal: 'Tourenplanung' },
  { key: 'pflegeplanung', label: 'Pflegeplanung', pascal: 'Pflegeplanung' },
  { key: 'leistungsnachweis', label: 'Leistungsnachweis', pascal: 'Leistungsnachweis' },
  { key: 'pflegedurchfuehrung', label: 'Pflegedurchführung', pascal: 'Pflegedurchfuehrung' },
  { key: 'pflegefachkraefte', label: 'Pflegefachkräfte', pascal: 'Pflegefachkraefte' },
] as const;

type EntityKey = typeof ENTITY_TABS[number]['key'];

export default function AdminPage() {
  const data = useDashboardData();
  const { loading, error, fetchAll } = data;

  const [activeTab, setActiveTab] = useState<EntityKey>('medikamentenplan');
  const [selectedIds, setSelectedIds] = useState<Record<EntityKey, Set<string>>>(() => ({
    medikamentenplan: new Set(),
    klientenstammdaten: new Set(),
    wunddokumentation: new Set(),
    vitalwerte_erfassung: new Set(),
    tourenplanung: new Set(),
    pflegeplanung: new Set(),
    leistungsnachweis: new Set(),
    pflegedurchfuehrung: new Set(),
    pflegefachkraefte: new Set(),
  }));
  const [filters, setFilters] = useState<Record<EntityKey, Record<string, string>>>(() => ({
    medikamentenplan: {},
    klientenstammdaten: {},
    wunddokumentation: {},
    vitalwerte_erfassung: {},
    tourenplanung: {},
    pflegeplanung: {},
    leistungsnachweis: {},
    pflegedurchfuehrung: {},
    pflegefachkraefte: {},
  }));
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [createEntity, setCreateEntity] = useState<EntityKey | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<{ entity: EntityKey; ids: string[] } | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState<EntityKey | null>(null);
  const [viewState, setViewState] = useState<{ entity: EntityKey; record: any } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');

  const getRecords = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'medikamentenplan': return (data as any).medikamentenplan as Medikamentenplan[] ?? [];
      case 'klientenstammdaten': return (data as any).klientenstammdaten as Klientenstammdaten[] ?? [];
      case 'wunddokumentation': return (data as any).wunddokumentation as Wunddokumentation[] ?? [];
      case 'vitalwerte_erfassung': return (data as any).vitalwerteErfassung as VitalwerteErfassung[] ?? [];
      case 'tourenplanung': return (data as any).tourenplanung as Tourenplanung[] ?? [];
      case 'pflegeplanung': return (data as any).pflegeplanung as Pflegeplanung[] ?? [];
      case 'leistungsnachweis': return (data as any).leistungsnachweis as Leistungsnachweis[] ?? [];
      case 'pflegedurchfuehrung': return (data as any).pflegedurchfuehrung as Pflegedurchfuehrung[] ?? [];
      case 'pflegefachkraefte': return (data as any).pflegefachkraefte as Pflegefachkraefte[] ?? [];
      default: return [];
    }
  }, [data]);

  const getLookupLists = useCallback((entity: EntityKey) => {
    const lists: Record<string, any[]> = {};
    switch (entity) {
      case 'medikamentenplan':
        lists.klientenstammdatenList = (data as any).klientenstammdaten ?? [];
        break;
      case 'wunddokumentation':
        lists.klientenstammdatenList = (data as any).klientenstammdaten ?? [];
        break;
      case 'vitalwerte_erfassung':
        lists.klientenstammdatenList = (data as any).klientenstammdaten ?? [];
        break;
      case 'tourenplanung':
        lists.pflegefachkraefteList = (data as any).pflegefachkraefte ?? [];
        lists.klientenstammdatenList = (data as any).klientenstammdaten ?? [];
        break;
      case 'pflegeplanung':
        lists.klientenstammdatenList = (data as any).klientenstammdaten ?? [];
        lists.pflegefachkraefteList = (data as any).pflegefachkraefte ?? [];
        break;
      case 'leistungsnachweis':
        lists.klientenstammdatenList = (data as any).klientenstammdaten ?? [];
        break;
      case 'pflegedurchfuehrung':
        lists.klientenstammdatenList = (data as any).klientenstammdaten ?? [];
        lists.tourenplanungList = (data as any).tourenplanung ?? [];
        lists.pflegefachkraefteList = (data as any).pflegefachkraefte ?? [];
        break;
    }
    return lists;
  }, [data]);

  const getApplookupDisplay = useCallback((entity: EntityKey, fieldKey: string, url?: unknown) => {
    if (!url) return '—';
    const id = extractRecordId(url);
    if (!id) return '—';
    const lists = getLookupLists(entity);
    void fieldKey; // ensure used for noUnusedParameters
    if (entity === 'medikamentenplan' && fieldKey === 'klient') {
      const match = (lists.klientenstammdatenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'wunddokumentation' && fieldKey === 'klient') {
      const match = (lists.klientenstammdatenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'vitalwerte_erfassung' && fieldKey === 'klient') {
      const match = (lists.klientenstammdatenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'tourenplanung' && fieldKey === 'zugeordnete_pflegekraefte') {
      const match = (lists.pflegefachkraefteList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'tourenplanung' && fieldKey === 'klienten') {
      const match = (lists.klientenstammdatenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'pflegeplanung' && fieldKey === 'klient') {
      const match = (lists.klientenstammdatenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'pflegeplanung' && fieldKey === 'erstellende_pflegekraft') {
      const match = (lists.pflegefachkraefteList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'leistungsnachweis' && fieldKey === 'klient') {
      const match = (lists.klientenstammdatenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'pflegedurchfuehrung' && fieldKey === 'klient') {
      const match = (lists.klientenstammdatenList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    if (entity === 'pflegedurchfuehrung' && fieldKey === 'tour') {
      const match = (lists.tourenplanungList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.tourbezeichnung ?? '—';
    }
    if (entity === 'pflegedurchfuehrung' && fieldKey === 'durchfuehrende_pflegekraft') {
      const match = (lists.pflegefachkraefteList ?? []).find((r: any) => r.record_id === id);
      return match?.fields.vorname ?? '—';
    }
    return String(url);
  }, [getLookupLists]);

  const getFieldMeta = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'medikamentenplan': return MEDIKAMENTENPLAN_FIELDS;
      case 'klientenstammdaten': return KLIENTENSTAMMDATEN_FIELDS;
      case 'wunddokumentation': return WUNDDOKUMENTATION_FIELDS;
      case 'vitalwerte_erfassung': return VITALWERTEERFASSUNG_FIELDS;
      case 'tourenplanung': return TOURENPLANUNG_FIELDS;
      case 'pflegeplanung': return PFLEGEPLANUNG_FIELDS;
      case 'leistungsnachweis': return LEISTUNGSNACHWEIS_FIELDS;
      case 'pflegedurchfuehrung': return PFLEGEDURCHFUEHRUNG_FIELDS;
      case 'pflegefachkraefte': return PFLEGEFACHKRAEFTE_FIELDS;
      default: return [];
    }
  }, []);

  const getFilteredRecords = useCallback((entity: EntityKey) => {
    const records = getRecords(entity);
    const s = search.toLowerCase();
    const searched = !s ? records : records.filter((r: any) => {
      return Object.values(r.fields).some((v: any) => {
        if (v == null) return false;
        if (Array.isArray(v)) return v.some((item: any) => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
        if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
        return String(v).toLowerCase().includes(s);
      });
    });
    const entityFilters = filters[entity] ?? {};
    const fieldMeta = getFieldMeta(entity);
    return searched.filter((r: any) => {
      return fieldMeta.every((fm: any) => {
        const fv = entityFilters[fm.key];
        if (!fv || fv === '') return true;
        const val = r.fields?.[fm.key];
        if (fm.type === 'bool') {
          if (fv === 'true') return val === true;
          if (fv === 'false') return val !== true;
          return true;
        }
        if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
          const label = val && typeof val === 'object' && 'label' in val ? val.label : '';
          return String(label).toLowerCase().includes(fv.toLowerCase());
        }
        if (fm.type.includes('multiplelookup')) {
          if (!Array.isArray(val)) return false;
          return val.some((item: any) => String(item?.label ?? '').toLowerCase().includes(fv.toLowerCase()));
        }
        if (fm.type.includes('applookup')) {
          const display = getApplookupDisplay(entity, fm.key, val);
          return String(display).toLowerCase().includes(fv.toLowerCase());
        }
        return String(val ?? '').toLowerCase().includes(fv.toLowerCase());
      });
    });
  }, [getRecords, filters, getFieldMeta, getApplookupDisplay, search]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const toggleSelect = useCallback((entity: EntityKey, id: string) => {
    setSelectedIds(prev => {
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (next[entity].has(id)) next[entity].delete(id);
      else next[entity].add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((entity: EntityKey) => {
    const filtered = getFilteredRecords(entity);
    setSelectedIds(prev => {
      const allSelected = filtered.every((r: any) => prev[entity].has(r.record_id));
      const next = { ...prev, [entity]: new Set(prev[entity]) };
      if (allSelected) {
        filtered.forEach((r: any) => next[entity].delete(r.record_id));
      } else {
        filtered.forEach((r: any) => next[entity].add(r.record_id));
      }
      return next;
    });
  }, [getFilteredRecords]);

  const clearSelection = useCallback((entity: EntityKey) => {
    setSelectedIds(prev => ({ ...prev, [entity]: new Set() }));
  }, []);

  const getServiceMethods = useCallback((entity: EntityKey) => {
    switch (entity) {
      case 'medikamentenplan': return {
        create: (fields: any) => LivingAppsService.createMedikamentenplanEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateMedikamentenplanEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteMedikamentenplanEntry(id),
      };
      case 'klientenstammdaten': return {
        create: (fields: any) => LivingAppsService.createKlientenstammdatenEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateKlientenstammdatenEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteKlientenstammdatenEntry(id),
      };
      case 'wunddokumentation': return {
        create: (fields: any) => LivingAppsService.createWunddokumentationEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateWunddokumentationEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteWunddokumentationEntry(id),
      };
      case 'vitalwerte_erfassung': return {
        create: (fields: any) => LivingAppsService.createVitalwerteErfassungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateVitalwerteErfassungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteVitalwerteErfassungEntry(id),
      };
      case 'tourenplanung': return {
        create: (fields: any) => LivingAppsService.createTourenplanungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updateTourenplanungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deleteTourenplanungEntry(id),
      };
      case 'pflegeplanung': return {
        create: (fields: any) => LivingAppsService.createPflegeplanungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updatePflegeplanungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deletePflegeplanungEntry(id),
      };
      case 'leistungsnachweis': return {
        create: (fields: any) => LivingAppsService.createLeistungsnachwei(fields),
        update: (id: string, fields: any) => LivingAppsService.updateLeistungsnachwei(id, fields),
        remove: (id: string) => LivingAppsService.deleteLeistungsnachwei(id),
      };
      case 'pflegedurchfuehrung': return {
        create: (fields: any) => LivingAppsService.createPflegedurchfuehrungEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updatePflegedurchfuehrungEntry(id, fields),
        remove: (id: string) => LivingAppsService.deletePflegedurchfuehrungEntry(id),
      };
      case 'pflegefachkraefte': return {
        create: (fields: any) => LivingAppsService.createPflegefachkraefteEntry(fields),
        update: (id: string, fields: any) => LivingAppsService.updatePflegefachkraefteEntry(id, fields),
        remove: (id: string) => LivingAppsService.deletePflegefachkraefteEntry(id),
      };
      default: return null;
    }
  }, []);

  async function handleCreate(entity: EntityKey, fields: any) {
    const svc = getServiceMethods(entity);
    if (!svc) return;
    await svc.create(fields);
    fetchAll();
    setCreateEntity(null);
  }

  async function handleUpdate(fields: any) {
    if (!dialogState) return;
    const svc = getServiceMethods(dialogState.entity);
    if (!svc) return;
    await svc.update(dialogState.record.record_id, fields);
    fetchAll();
    setDialogState(null);
  }

  async function handleBulkDelete() {
    if (!deleteTargets) return;
    const svc = getServiceMethods(deleteTargets.entity);
    if (!svc) return;
    setBulkLoading(true);
    try {
      for (const id of deleteTargets.ids) {
        await svc.remove(id);
      }
      clearSelection(deleteTargets.entity);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setDeleteTargets(null);
    }
  }

  async function handleBulkClone() {
    const svc = getServiceMethods(activeTab);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const records = getRecords(activeTab);
      const ids = Array.from(selectedIds[activeTab]);
      for (const id of ids) {
        const rec = records.find((r: any) => r.record_id === id);
        if (!rec) continue;
        const clean = cleanFieldsForApi(rec.fields, activeTab);
        await svc.create(clean as any);
      }
      clearSelection(activeTab);
      fetchAll();
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkEdit(fieldKey: string, value: any) {
    if (!bulkEditOpen) return;
    const svc = getServiceMethods(bulkEditOpen);
    if (!svc) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds[bulkEditOpen]);
      for (const id of ids) {
        await svc.update(id, { [fieldKey]: value });
      }
      clearSelection(bulkEditOpen);
      fetchAll();
    } finally {
      setBulkLoading(false);
      setBulkEditOpen(null);
    }
  }

  function updateFilter(entity: EntityKey, fieldKey: string, value: string) {
    setFilters(prev => ({
      ...prev,
      [entity]: { ...prev[entity], [fieldKey]: value },
    }));
  }

  function clearEntityFilters(entity: EntityKey) {
    setFilters(prev => ({ ...prev, [entity]: {} }));
  }

  const activeFilterCount = useMemo(() => {
    const f = filters[activeTab] ?? {};
    return Object.values(f).filter(v => v && v !== '').length;
  }, [filters, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-destructive">{error.message}</p>
        <Button onClick={fetchAll}>Erneut versuchen</Button>
      </div>
    );
  }

  const filtered = getFilteredRecords(activeTab);
  const sel = selectedIds[activeTab];
  const allFiltered = filtered.every((r: any) => sel.has(r.record_id)) && filtered.length > 0;
  const fieldMeta = getFieldMeta(activeTab);

  return (
    <PageShell
      title="Verwaltung"
      subtitle="Alle Daten verwalten"
      action={
        <Button onClick={() => setCreateEntity(activeTab)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Hinzufügen
        </Button>
      }
    >
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TABS.map(tab => {
          const count = getRecords(tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); setSortKey(''); setSortDir('asc'); fetchAll(); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters(f => !f)} className="gap-2">
            <Filter className="h-4 w-4" />
            Filtern
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => clearEntityFilters(activeTab)}>
              Filter zurücksetzen
            </Button>
          )}
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 flex-wrap bg-muted/60 rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium">{sel.size} ausgewählt</span>
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(activeTab)}>
              <Pencil className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Feld bearbeiten</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkClone()}>
              <Copy className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Kopieren</span>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteTargets({ entity: activeTab, ids: Array.from(sel) })}>
              <Trash2 className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Ausgewählte löschen</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => clearSelection(activeTab)}>
              <X className="h-3.5 w-3.5 sm:mr-1" /> <span className="hidden sm:inline">Auswahl aufheben</span>
            </Button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
          {fieldMeta.map((fm: any) => (
            <div key={fm.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{fm.label}</label>
              {fm.type === 'bool' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="true">Ja</SelectItem>
                    <SelectItem value="false">Nein</SelectItem>
                  </SelectContent>
                </Select>
              ) : fm.type === 'lookup/select' || fm.type === 'lookup/radio' ? (
                <Select value={filters[activeTab]?.[fm.key] ?? ''} onValueChange={v => updateFilter(activeTab, fm.key, v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Alle" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {fm.options?.map((o: any) => (
                      <SelectItem key={o.key} value={o.label}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="h-8 text-xs"
                  placeholder="Filtern..."
                  value={filters[activeTab]?.[fm.key] ?? ''}
                  onChange={e => updateFilter(activeTab, fm.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[27px] bg-card shadow-lg overflow-x-auto">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="w-10 px-6">
                <Checkbox
                  checked={allFiltered}
                  onCheckedChange={() => toggleSelectAll(activeTab)}
                />
              </TableHead>
              {fieldMeta.map((fm: any) => (
                <TableHead key={fm.key} className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(fm.key)}>
                  <span className="inline-flex items-center gap-1">
                    {fm.label}
                    {sortKey === fm.key ? (sortDir === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="opacity-30" />}
                  </span>
                </TableHead>
              ))}
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map((record: any) => (
              <TableRow key={record.record_id} className={`transition-colors cursor-pointer ${sel.has(record.record_id) ? "bg-primary/5" : "hover:bg-muted/50"}`} onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; setViewState({ entity: activeTab, record }); }}>
                <TableCell>
                  <Checkbox
                    checked={sel.has(record.record_id)}
                    onCheckedChange={() => toggleSelect(activeTab, record.record_id)}
                  />
                </TableCell>
                {fieldMeta.map((fm: any) => {
                  const val = record.fields?.[fm.key];
                  if (fm.type === 'bool') {
                    return (
                      <TableCell key={fm.key}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          val ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}>
                          {val ? 'Ja' : 'Nein'}
                        </span>
                      </TableCell>
                    );
                  }
                  if (fm.type === 'lookup/select' || fm.type === 'lookup/radio') {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{val?.label ?? '—'}</span></TableCell>;
                  }
                  if (fm.type.includes('multiplelookup')) {
                    return <TableCell key={fm.key}>{Array.isArray(val) ? val.map((v: any) => v?.label ?? v).join(', ') : '—'}</TableCell>;
                  }
                  if (fm.type.includes('applookup')) {
                    return <TableCell key={fm.key}><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getApplookupDisplay(activeTab, fm.key, val)}</span></TableCell>;
                  }
                  if (fm.type.includes('date')) {
                    return <TableCell key={fm.key} className="text-muted-foreground">{fmtDate(val)}</TableCell>;
                  }
                  if (fm.type.startsWith('file')) {
                    return (
                      <TableCell key={fm.key}>
                        {val ? (
                          <div className="relative h-8 w-8 rounded bg-muted overflow-hidden">
                            <img src={val} alt="" className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          </div>
                        ) : '—'}
                      </TableCell>
                    );
                  }
                  if (fm.type === 'string/textarea') {
                    return <TableCell key={fm.key} className="max-w-xs"><span className="truncate block">{val ?? '—'}</span></TableCell>;
                  }
                  if (fm.type === 'geo') {
                    return (
                      <TableCell key={fm.key} className="max-w-[200px]">
                        <span className="truncate block" title={val ? `${val.lat}, ${val.long}` : undefined}>
                          {val?.info ?? (val ? `${val.lat?.toFixed(4)}, ${val.long?.toFixed(4)}` : '—')}
                        </span>
                      </TableCell>
                    );
                  }
                  return <TableCell key={fm.key}>{val ?? '—'}</TableCell>;
                })}
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDialogState({ entity: activeTab, record })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTargets({ entity: activeTab, ids: [record.record_id] })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={fieldMeta.length + 2} className="text-center py-16 text-muted-foreground">
                  Keine Ergebnisse gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(createEntity === 'medikamentenplan' || dialogState?.entity === 'medikamentenplan') && (
        <MedikamentenplanDialog
          open={createEntity === 'medikamentenplan' || dialogState?.entity === 'medikamentenplan'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'medikamentenplan' ? handleUpdate : (fields: any) => handleCreate('medikamentenplan', fields)}
          defaultValues={dialogState?.entity === 'medikamentenplan' ? dialogState.record?.fields : undefined}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Medikamentenplan']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Medikamentenplan']}
        />
      )}
      {(createEntity === 'klientenstammdaten' || dialogState?.entity === 'klientenstammdaten') && (
        <KlientenstammdatenDialog
          open={createEntity === 'klientenstammdaten' || dialogState?.entity === 'klientenstammdaten'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'klientenstammdaten' ? handleUpdate : (fields: any) => handleCreate('klientenstammdaten', fields)}
          defaultValues={dialogState?.entity === 'klientenstammdaten' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Klientenstammdaten']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Klientenstammdaten']}
        />
      )}
      {(createEntity === 'wunddokumentation' || dialogState?.entity === 'wunddokumentation') && (
        <WunddokumentationDialog
          open={createEntity === 'wunddokumentation' || dialogState?.entity === 'wunddokumentation'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'wunddokumentation' ? handleUpdate : (fields: any) => handleCreate('wunddokumentation', fields)}
          defaultValues={dialogState?.entity === 'wunddokumentation' ? dialogState.record?.fields : undefined}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Wunddokumentation']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Wunddokumentation']}
        />
      )}
      {(createEntity === 'vitalwerte_erfassung' || dialogState?.entity === 'vitalwerte_erfassung') && (
        <VitalwerteErfassungDialog
          open={createEntity === 'vitalwerte_erfassung' || dialogState?.entity === 'vitalwerte_erfassung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'vitalwerte_erfassung' ? handleUpdate : (fields: any) => handleCreate('vitalwerte_erfassung', fields)}
          defaultValues={dialogState?.entity === 'vitalwerte_erfassung' ? dialogState.record?.fields : undefined}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['VitalwerteErfassung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['VitalwerteErfassung']}
        />
      )}
      {(createEntity === 'tourenplanung' || dialogState?.entity === 'tourenplanung') && (
        <TourenplanungDialog
          open={createEntity === 'tourenplanung' || dialogState?.entity === 'tourenplanung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'tourenplanung' ? handleUpdate : (fields: any) => handleCreate('tourenplanung', fields)}
          defaultValues={dialogState?.entity === 'tourenplanung' ? dialogState.record?.fields : undefined}
          pflegefachkraefteList={(data as any).pflegefachkraefte ?? []}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Tourenplanung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Tourenplanung']}
        />
      )}
      {(createEntity === 'pflegeplanung' || dialogState?.entity === 'pflegeplanung') && (
        <PflegeplanungDialog
          open={createEntity === 'pflegeplanung' || dialogState?.entity === 'pflegeplanung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'pflegeplanung' ? handleUpdate : (fields: any) => handleCreate('pflegeplanung', fields)}
          defaultValues={dialogState?.entity === 'pflegeplanung' ? dialogState.record?.fields : undefined}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          pflegefachkraefteList={(data as any).pflegefachkraefte ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Pflegeplanung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Pflegeplanung']}
        />
      )}
      {(createEntity === 'leistungsnachweis' || dialogState?.entity === 'leistungsnachweis') && (
        <LeistungsnachweisDialog
          open={createEntity === 'leistungsnachweis' || dialogState?.entity === 'leistungsnachweis'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'leistungsnachweis' ? handleUpdate : (fields: any) => handleCreate('leistungsnachweis', fields)}
          defaultValues={dialogState?.entity === 'leistungsnachweis' ? dialogState.record?.fields : undefined}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Leistungsnachweis']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Leistungsnachweis']}
        />
      )}
      {(createEntity === 'pflegedurchfuehrung' || dialogState?.entity === 'pflegedurchfuehrung') && (
        <PflegedurchfuehrungDialog
          open={createEntity === 'pflegedurchfuehrung' || dialogState?.entity === 'pflegedurchfuehrung'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'pflegedurchfuehrung' ? handleUpdate : (fields: any) => handleCreate('pflegedurchfuehrung', fields)}
          defaultValues={dialogState?.entity === 'pflegedurchfuehrung' ? dialogState.record?.fields : undefined}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          tourenplanungList={(data as any).tourenplanung ?? []}
          pflegefachkraefteList={(data as any).pflegefachkraefte ?? []}
          enablePhotoScan={AI_PHOTO_SCAN['Pflegedurchfuehrung']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Pflegedurchfuehrung']}
        />
      )}
      {(createEntity === 'pflegefachkraefte' || dialogState?.entity === 'pflegefachkraefte') && (
        <PflegefachkraefteDialog
          open={createEntity === 'pflegefachkraefte' || dialogState?.entity === 'pflegefachkraefte'}
          onClose={() => { setCreateEntity(null); setDialogState(null); }}
          onSubmit={dialogState?.entity === 'pflegefachkraefte' ? handleUpdate : (fields: any) => handleCreate('pflegefachkraefte', fields)}
          defaultValues={dialogState?.entity === 'pflegefachkraefte' ? dialogState.record?.fields : undefined}
          enablePhotoScan={AI_PHOTO_SCAN['Pflegefachkraefte']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Pflegefachkraefte']}
        />
      )}
      {viewState?.entity === 'medikamentenplan' && (
        <MedikamentenplanViewDialog
          open={viewState?.entity === 'medikamentenplan'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'medikamentenplan', record: r }); }}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
        />
      )}
      {viewState?.entity === 'klientenstammdaten' && (
        <KlientenstammdatenViewDialog
          open={viewState?.entity === 'klientenstammdaten'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'klientenstammdaten', record: r }); }}
        />
      )}
      {viewState?.entity === 'wunddokumentation' && (
        <WunddokumentationViewDialog
          open={viewState?.entity === 'wunddokumentation'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'wunddokumentation', record: r }); }}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
        />
      )}
      {viewState?.entity === 'vitalwerte_erfassung' && (
        <VitalwerteErfassungViewDialog
          open={viewState?.entity === 'vitalwerte_erfassung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'vitalwerte_erfassung', record: r }); }}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
        />
      )}
      {viewState?.entity === 'tourenplanung' && (
        <TourenplanungViewDialog
          open={viewState?.entity === 'tourenplanung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'tourenplanung', record: r }); }}
          pflegefachkraefteList={(data as any).pflegefachkraefte ?? []}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
        />
      )}
      {viewState?.entity === 'pflegeplanung' && (
        <PflegeplanungViewDialog
          open={viewState?.entity === 'pflegeplanung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'pflegeplanung', record: r }); }}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          pflegefachkraefteList={(data as any).pflegefachkraefte ?? []}
        />
      )}
      {viewState?.entity === 'leistungsnachweis' && (
        <LeistungsnachweisViewDialog
          open={viewState?.entity === 'leistungsnachweis'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'leistungsnachweis', record: r }); }}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
        />
      )}
      {viewState?.entity === 'pflegedurchfuehrung' && (
        <PflegedurchfuehrungViewDialog
          open={viewState?.entity === 'pflegedurchfuehrung'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'pflegedurchfuehrung', record: r }); }}
          klientenstammdatenList={(data as any).klientenstammdaten ?? []}
          tourenplanungList={(data as any).tourenplanung ?? []}
          pflegefachkraefteList={(data as any).pflegefachkraefte ?? []}
        />
      )}
      {viewState?.entity === 'pflegefachkraefte' && (
        <PflegefachkraefteViewDialog
          open={viewState?.entity === 'pflegefachkraefte'}
          onClose={() => setViewState(null)}
          record={viewState?.record}
          onEdit={(r: any) => { setViewState(null); setDialogState({ entity: 'pflegefachkraefte', record: r }); }}
        />
      )}

      <BulkEditDialog
        open={!!bulkEditOpen}
        onClose={() => setBulkEditOpen(null)}
        onApply={handleBulkEdit}
        fields={bulkEditOpen ? getFieldMeta(bulkEditOpen) : []}
        selectedCount={bulkEditOpen ? selectedIds[bulkEditOpen].size : 0}
        loading={bulkLoading}
        lookupLists={bulkEditOpen ? getLookupLists(bulkEditOpen) : {}}
      />

      <ConfirmDialog
        open={!!deleteTargets}
        onClose={() => setDeleteTargets(null)}
        onConfirm={handleBulkDelete}
        title="Ausgewählte löschen"
        description={`Sollen ${deleteTargets?.ids.length ?? 0} Einträge wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.`}
      />
    </PageShell>
  );
}