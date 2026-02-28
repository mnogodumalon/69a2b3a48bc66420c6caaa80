// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Klientenstammdaten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    geschlecht?: 'weiblich' | 'maennlich' | 'divers';
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    stadt?: string;
    telefon?: string;
    mobil?: string;
    email?: string;
    standort?: string;
    krankenversicherung?: string;
    versichertennummer?: string;
    pflegegrad?: 'pflegegrad_1' | 'pflegegrad_2' | 'pflegegrad_3' | 'pflegegrad_4' | 'pflegegrad_5';
    kostentraeger?: string;
    notfallkontakt_vorname?: string;
    notfallkontakt_nachname?: string;
    notfallkontakt_beziehung?: string;
    notfallkontakt_telefon?: string;
    hausarzt_name?: string;
    hausarzt_telefon?: string;
    besonderheiten?: string;
  };
}

export interface Pflegefachkraefte {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    qualifikation?: 'pflegefachkraft' | 'pflegehilfskraft' | 'krankenpfleger' | 'altenpfleger' | 'pflegedienstleitung';
    rolle?: 'rolle_fachkraft' | 'rolle_hilfskraft' | 'rolle_verwaltung';
    personalnummer?: string;
    telefon?: string;
    email?: string;
    aktiv?: boolean;
  };
}

export interface Medikamentenplan {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
    medikamentenname?: string;
    wirkstoff?: string;
    darreichungsform?: 'tablette' | 'kapsel' | 'tropfen' | 'salbe' | 'injektion' | 'pflaster' | 'sonstiges';
    dosierung?: string;
    einnahmezeiten?: ('morgens' | 'mittags' | 'abends' | 'zur_nacht' | 'bei_bedarf')[];
    einnahmehinweise?: string;
    verordnungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    verordnender_arzt?: string;
    bemerkungen?: string;
  };
}

export interface Pflegeplanung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
    erstellende_pflegekraft?: string; // applookup -> URL zu 'Pflegefachkraefte' Record
    erstellungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    pflegebeduerftige_situation?: string;
    vorerkrankungen?: string;
    aktuelle_diagnosen?: string;
    ressourcen?: string;
    risiken?: ('dekubitusgefahr' | 'mangelernaehrung' | 'dehydratation' | 'kontrakturgefahr' | 'aspirationsgefahr' | 'sturzgefahr')[];
    pflegediagnosen?: string;
    pflegeziele?: string;
    geplante_massnahmen?: string;
    naechste_evaluation?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Tourenplanung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    tourdatum?: string; // Format: YYYY-MM-DD oder ISO String
    tourbezeichnung?: string;
    zugeordnete_pflegekraefte?: string;
    klienten?: string;
    startzeit?: string;
    endzeit?: string;
    notfaelle?: boolean;
    bemerkungen?: string;
  };
}

export interface VitalwerteErfassung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
    messzeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    blutdruck_systolisch?: number;
    blutdruck_diastolisch?: number;
    puls?: number;
    temperatur?: number;
    gewicht?: number;
    blutzucker?: number;
    sauerstoffsaettigung?: number;
    atemfrequenz?: number;
    messgeraet?: string;
    bemerkungen?: string;
  };
}

export interface Wunddokumentation {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
    dokumentationsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    koerperregion?: 'kopf' | 'hals' | 'brust' | 'bauch' | 'ruecken' | 'gesaess' | 'linker_arm' | 'rechter_arm' | 'linkes_bein' | 'rechtes_bein' | 'linker_fuss' | 'rechter_fuss';
    genaue_lokalisation?: string;
    wundtyp?: 'dekubitus' | 'ulcus_cruris' | 'diabetisches_fusssyndrom' | 'chirurgische_wunde' | 'traumatische_wunde' | 'sonstige';
    wundlaenge?: number;
    wundbreite?: number;
    wundtiefe?: number;
    wundstadium?: 'grad_1' | 'grad_2' | 'grad_3' | 'grad_4';
    wundzustand?: ('sauber' | 'verschmutzt' | 'nekrotisch' | 'fibrinbelegt' | 'granulierend' | 'epithelisierend')[];
    exsudat?: 'kein' | 'gering' | 'maessig' | 'stark';
    geruch?: boolean;
    wundfoto?: string;
    durchgefuehrte_massnahmen?: string;
    verwendete_materialien?: string;
    naechster_verbandwechsel?: string; // Format: YYYY-MM-DD oder ISO String
    bemerkungen?: string;
  };
}

export interface Pflegedurchfuehrung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
    tour?: string; // applookup -> URL zu 'Tourenplanung' Record
    durchfuehrende_pflegekraft?: string; // applookup -> URL zu 'Pflegefachkraefte' Record
    besuchsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    leistungsart?: ('grundpflege' | 'behandlungspflege' | 'hauswirtschaft' | 'betreuung' | 'medikamentengabe' | 'verbandwechsel' | 'mobilisation')[];
    dauer_minuten?: number;
    pflegebericht?: string;
    besonderheiten?: string;
    massnahmen_erforderlich?: boolean;
    weitere_massnahmen?: string;
  };
}

export interface Leistungsnachweis {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
  };
}

export const APP_IDS = {
  KLIENTENSTAMMDATEN: '69a2b374e8f430d34bb01a82',
  PFLEGEFACHKRAEFTE: '69a2b37ce4a6c238edbda7f7',
  MEDIKAMENTENPLAN: '69a2b37dddc4d201a06278f2',
  PFLEGEPLANUNG: '69a2b37e59b1455ce4d42f6d',
  TOURENPLANUNG: '69a2b37f4ba887f6b8f00834',
  VITALWERTE_ERFASSUNG: '69a2b37f9988ba76e2b41821',
  WUNDDOKUMENTATION: '69a2b380da2d16583370c8e5',
  PFLEGEDURCHFUEHRUNG: '69a2b3815d9195a12c0668b1',
  LEISTUNGSNACHWEIS: '69a2b382c9dc1d577bd6c8ec',
} as const;

// Helper Types for creating new records
export type CreateKlientenstammdaten = Klientenstammdaten['fields'];
export type CreatePflegefachkraefte = Pflegefachkraefte['fields'];
export type CreateMedikamentenplan = Medikamentenplan['fields'];
export type CreatePflegeplanung = Pflegeplanung['fields'];
export type CreateTourenplanung = Tourenplanung['fields'];
export type CreateVitalwerteErfassung = VitalwerteErfassung['fields'];
export type CreateWunddokumentation = Wunddokumentation['fields'];
export type CreatePflegedurchfuehrung = Pflegedurchfuehrung['fields'];
export type CreateLeistungsnachweis = Leistungsnachweis['fields'];