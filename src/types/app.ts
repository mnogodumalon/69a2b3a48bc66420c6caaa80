// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Medikamentenplan {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
    medikamentenname?: string;
    wirkstoff?: string;
    darreichungsform?: LookupValue;
    dosierung?: string;
    einnahmezeiten?: LookupValue[];
    einnahmehinweise?: string;
    verordnungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    verordnender_arzt?: string;
    bemerkungen?: string;
  };
}

export interface Klientenstammdaten {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    geburtsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    geschlecht?: LookupValue;
    strasse?: string;
    hausnummer?: string;
    postleitzahl?: string;
    stadt?: string;
    telefon?: string;
    mobil?: string;
    email?: string;
    standort?: GeoLocation; // { lat, long, info }
    krankenversicherung?: string;
    versichertennummer?: string;
    pflegegrad?: LookupValue;
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

export interface Wunddokumentation {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    dokumentationsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    koerperregion?: LookupValue;
    genaue_lokalisation?: string;
    wundtyp?: LookupValue;
    wundbreite?: number;
    wundtiefe?: number;
    wundstadium?: LookupValue;
    wundzustand?: LookupValue[];
    exsudat?: LookupValue;
    geruch?: boolean;
    wundfoto?: string;
    durchgefuehrte_massnahmen?: string;
    verwendete_materialien?: string;
    naechster_verbandwechsel?: string; // Format: YYYY-MM-DD oder ISO String
    bemerkungen?: string;
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
    wundlaenge?: number;
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
    risiken?: LookupValue[];
    pflegediagnosen?: string;
    pflegeziele?: string;
    geplante_massnahmen?: string;
    naechste_evaluation?: string; // Format: YYYY-MM-DD oder ISO String
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

export interface Pflegedurchfuehrung {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    klient?: string; // applookup -> URL zu 'Klientenstammdaten' Record
    tour?: string; // applookup -> URL zu 'Tourenplanung' Record
    durchfuehrende_pflegekraft?: string; // applookup -> URL zu 'Pflegefachkraefte' Record
    besuchsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    leistungsart?: LookupValue[];
    dauer_minuten?: number;
    pflegebericht?: string;
    besonderheiten?: string;
    massnahmen_erforderlich?: boolean;
    weitere_massnahmen?: string;
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
    qualifikation?: LookupValue;
    rolle?: LookupValue;
    personalnummer?: string;
    telefon?: string;
    email?: string;
    aktiv?: boolean;
  };
}

export const APP_IDS = {
  MEDIKAMENTENPLAN: '69a2b37dddc4d201a06278f2',
  KLIENTENSTAMMDATEN: '69a2b374e8f430d34bb01a82',
  WUNDDOKUMENTATION: '69a2b380da2d16583370c8e5',
  VITALWERTE_ERFASSUNG: '69a2b37f9988ba76e2b41821',
  TOURENPLANUNG: '69a2b37f4ba887f6b8f00834',
  PFLEGEPLANUNG: '69a2b37e59b1455ce4d42f6d',
  LEISTUNGSNACHWEIS: '69a2b382c9dc1d577bd6c8ec',
  PFLEGEDURCHFUEHRUNG: '69a2b3815d9195a12c0668b1',
  PFLEGEFACHKRAEFTE: '69a2b37ce4a6c238edbda7f7',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  medikamentenplan: {
    darreichungsform: [{ key: "tablette", label: "Tablette" }, { key: "kapsel", label: "Kapsel" }, { key: "tropfen", label: "Tropfen" }, { key: "salbe", label: "Salbe" }, { key: "injektion", label: "Injektion" }, { key: "pflaster", label: "Pflaster" }, { key: "sonstiges", label: "Sonstiges" }],
    einnahmezeiten: [{ key: "morgens", label: "Morgens" }, { key: "mittags", label: "Mittags" }, { key: "abends", label: "Abends" }, { key: "zur_nacht", label: "Zur Nacht" }, { key: "bei_bedarf", label: "Bei Bedarf" }],
  },
  klientenstammdaten: {
    geschlecht: [{ key: "weiblich", label: "Weiblich" }, { key: "maennlich", label: "Männlich" }, { key: "divers", label: "Divers" }],
    pflegegrad: [{ key: "pflegegrad_1", label: "Pflegegrad 1" }, { key: "pflegegrad_2", label: "Pflegegrad 2" }, { key: "pflegegrad_3", label: "Pflegegrad 3" }, { key: "pflegegrad_4", label: "Pflegegrad 4" }, { key: "pflegegrad_5", label: "Pflegegrad 5" }],
  },
  wunddokumentation: {
    koerperregion: [{ key: "kopf", label: "Kopf" }, { key: "hals", label: "Hals" }, { key: "brust", label: "Brust" }, { key: "bauch", label: "Bauch" }, { key: "ruecken", label: "Rücken" }, { key: "gesaess", label: "Gesäß" }, { key: "linker_arm", label: "Linker Arm" }, { key: "rechter_arm", label: "Rechter Arm" }, { key: "linkes_bein", label: "Linkes Bein" }, { key: "rechtes_bein", label: "Rechtes Bein" }, { key: "linker_fuss", label: "Linker Fuß" }, { key: "rechter_fuss", label: "Rechter Fuß" }],
    wundtyp: [{ key: "dekubitus", label: "Dekubitus" }, { key: "ulcus_cruris", label: "Ulcus cruris" }, { key: "diabetisches_fusssyndrom", label: "Diabetisches Fußsyndrom" }, { key: "chirurgische_wunde", label: "Chirurgische Wunde" }, { key: "traumatische_wunde", label: "Traumatische Wunde" }, { key: "sonstige", label: "Sonstige" }],
    wundstadium: [{ key: "grad_1", label: "Grad 1" }, { key: "grad_2", label: "Grad 2" }, { key: "grad_3", label: "Grad 3" }, { key: "grad_4", label: "Grad 4" }],
    wundzustand: [{ key: "sauber", label: "Sauber" }, { key: "verschmutzt", label: "Verschmutzt" }, { key: "nekrotisch", label: "Nekrotisch" }, { key: "fibrinbelegt", label: "Fibrinbelegt" }, { key: "granulierend", label: "Granulierend" }, { key: "epithelisierend", label: "Epithelisierend" }],
    exsudat: [{ key: "kein", label: "Kein Exsudat" }, { key: "gering", label: "Gering" }, { key: "maessig", label: "Mäßig" }, { key: "stark", label: "Stark" }],
  },
  pflegeplanung: {
    risiken: [{ key: "dekubitusgefahr", label: "Dekubitusgefahr" }, { key: "mangelernaehrung", label: "Mangelernährung" }, { key: "dehydratation", label: "Dehydratation" }, { key: "kontrakturgefahr", label: "Kontrakturgefahr" }, { key: "aspirationsgefahr", label: "Aspirationsgefahr" }, { key: "sturzgefahr", label: "Sturzgefahr" }],
  },
  pflegedurchfuehrung: {
    leistungsart: [{ key: "grundpflege", label: "Grundpflege" }, { key: "behandlungspflege", label: "Behandlungspflege" }, { key: "hauswirtschaft", label: "Hauswirtschaftliche Versorgung" }, { key: "betreuung", label: "Betreuungsleistungen" }, { key: "medikamentengabe", label: "Medikamentengabe" }, { key: "verbandwechsel", label: "Verbandwechsel" }, { key: "mobilisation", label: "Mobilisation" }],
  },
  pflegefachkraefte: {
    qualifikation: [{ key: "pflegefachkraft", label: "Examinierte Pflegefachkraft" }, { key: "pflegehilfskraft", label: "Pflegehilfskraft" }, { key: "krankenpfleger", label: "Gesundheits- und Krankenpfleger/in" }, { key: "altenpfleger", label: "Altenpfleger/in" }, { key: "pflegedienstleitung", label: "Pflegedienstleitung" }],
    rolle: [{ key: "rolle_fachkraft", label: "Pflegefachkraft (Planung/Anamnese)" }, { key: "rolle_hilfskraft", label: "Pflegehilfskraft (Durchführung)" }, { key: "rolle_verwaltung", label: "Verwaltung (Abrechnung)" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'medikamentenplan': {
    'klient': 'applookup/select',
    'medikamentenname': 'string/text',
    'wirkstoff': 'string/text',
    'darreichungsform': 'lookup/select',
    'dosierung': 'string/text',
    'einnahmezeiten': 'multiplelookup/checkbox',
    'einnahmehinweise': 'string/textarea',
    'verordnungsdatum': 'date/date',
    'verordnender_arzt': 'string/text',
    'bemerkungen': 'string/textarea',
  },
  'klientenstammdaten': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'geschlecht': 'lookup/select',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'postleitzahl': 'string/text',
    'stadt': 'string/text',
    'telefon': 'string/tel',
    'mobil': 'string/tel',
    'email': 'string/email',
    'standort': 'geo',
    'krankenversicherung': 'string/text',
    'versichertennummer': 'string/text',
    'pflegegrad': 'lookup/select',
    'kostentraeger': 'string/text',
    'notfallkontakt_vorname': 'string/text',
    'notfallkontakt_nachname': 'string/text',
    'notfallkontakt_beziehung': 'string/text',
    'notfallkontakt_telefon': 'string/tel',
    'hausarzt_name': 'string/text',
    'hausarzt_telefon': 'string/tel',
    'besonderheiten': 'string/textarea',
  },
  'wunddokumentation': {
    'dokumentationsdatum': 'date/datetimeminute',
    'koerperregion': 'lookup/select',
    'genaue_lokalisation': 'string/text',
    'wundtyp': 'lookup/select',
    'wundbreite': 'number',
    'wundtiefe': 'number',
    'wundstadium': 'lookup/select',
    'wundzustand': 'multiplelookup/checkbox',
    'exsudat': 'lookup/select',
    'geruch': 'bool',
    'wundfoto': 'file',
    'durchgefuehrte_massnahmen': 'string/textarea',
    'verwendete_materialien': 'string/textarea',
    'naechster_verbandwechsel': 'date/date',
    'bemerkungen': 'string/textarea',
    'klient': 'applookup/select',
    'wundlaenge': 'number',
  },
  'vitalwerte_erfassung': {
    'klient': 'applookup/select',
    'messzeitpunkt': 'date/datetimeminute',
    'blutdruck_systolisch': 'number',
    'blutdruck_diastolisch': 'number',
    'puls': 'number',
    'temperatur': 'number',
    'gewicht': 'number',
    'blutzucker': 'number',
    'sauerstoffsaettigung': 'number',
    'atemfrequenz': 'number',
    'messgeraet': 'string/text',
    'bemerkungen': 'string/textarea',
  },
  'tourenplanung': {
    'tourdatum': 'date/date',
    'tourbezeichnung': 'string/text',
    'zugeordnete_pflegekraefte': 'multipleapplookup/select',
    'klienten': 'multipleapplookup/select',
    'startzeit': 'string/text',
    'endzeit': 'string/text',
    'notfaelle': 'bool',
    'bemerkungen': 'string/textarea',
  },
  'pflegeplanung': {
    'klient': 'applookup/select',
    'erstellende_pflegekraft': 'applookup/select',
    'erstellungsdatum': 'date/date',
    'pflegebeduerftige_situation': 'string/textarea',
    'vorerkrankungen': 'string/textarea',
    'aktuelle_diagnosen': 'string/textarea',
    'ressourcen': 'string/textarea',
    'risiken': 'multiplelookup/checkbox',
    'pflegediagnosen': 'string/textarea',
    'pflegeziele': 'string/textarea',
    'geplante_massnahmen': 'string/textarea',
    'naechste_evaluation': 'date/date',
  },
  'leistungsnachweis': {
    'klient': 'applookup/select',
  },
  'pflegedurchfuehrung': {
    'klient': 'applookup/select',
    'tour': 'applookup/select',
    'durchfuehrende_pflegekraft': 'applookup/select',
    'besuchsdatum': 'date/datetimeminute',
    'leistungsart': 'multiplelookup/checkbox',
    'dauer_minuten': 'number',
    'pflegebericht': 'string/textarea',
    'besonderheiten': 'string/textarea',
    'massnahmen_erforderlich': 'bool',
    'weitere_massnahmen': 'string/textarea',
  },
  'pflegefachkraefte': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'geburtsdatum': 'date/date',
    'qualifikation': 'lookup/select',
    'rolle': 'lookup/select',
    'personalnummer': 'string/text',
    'telefon': 'string/tel',
    'email': 'string/email',
    'aktiv': 'bool',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateMedikamentenplan = StripLookup<Medikamentenplan['fields']>;
export type CreateKlientenstammdaten = StripLookup<Klientenstammdaten['fields']>;
export type CreateWunddokumentation = StripLookup<Wunddokumentation['fields']>;
export type CreateVitalwerteErfassung = StripLookup<VitalwerteErfassung['fields']>;
export type CreateTourenplanung = StripLookup<Tourenplanung['fields']>;
export type CreatePflegeplanung = StripLookup<Pflegeplanung['fields']>;
export type CreateLeistungsnachweis = StripLookup<Leistungsnachweis['fields']>;
export type CreatePflegedurchfuehrung = StripLookup<Pflegedurchfuehrung['fields']>;
export type CreatePflegefachkraefte = StripLookup<Pflegefachkraefte['fields']>;