// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS, LOOKUP_OPTIONS, FIELD_TYPES } from '@/types/app';
import type { Medikamentenplan, Klientenstammdaten, Wunddokumentation, VitalwerteErfassung, Tourenplanung, Pflegeplanung, Leistungsnachweis, Pflegedurchfuehrung, Pflegefachkraefte } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: unknown): string | null {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

function enrichLookupFields<T extends { fields: Record<string, unknown> }>(
  records: T[], entityKey: string
): T[] {
  const opts = LOOKUP_OPTIONS[entityKey];
  if (!opts) return records;
  return records.map(r => {
    const fields = { ...r.fields };
    for (const [fieldKey, options] of Object.entries(opts)) {
      const val = fields[fieldKey];
      if (typeof val === 'string') {
        const m = options.find(o => o.key === val);
        fields[fieldKey] = m ?? { key: val, label: val };
      } else if (Array.isArray(val)) {
        fields[fieldKey] = val.map(v => {
          if (typeof v === 'string') {
            const m = options.find(o => o.key === v);
            return m ?? { key: v, label: v };
          }
          return v;
        });
      }
    }
    return { ...r, fields } as T;
  });
}

/** Normalize fields for API writes: strip lookup objects to keys, fix date formats. */
export function cleanFieldsForApi(
  fields: Record<string, unknown>,
  entityKey: string
): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...fields };
  for (const [k, v] of Object.entries(clean)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && 'key' in v) clean[k] = (v as any).key;
    if (Array.isArray(v)) clean[k] = v.map((item: any) => item && typeof item === 'object' && 'key' in item ? item.key : item);
  }
  const types = FIELD_TYPES[entityKey];
  if (types) {
    for (const [k, ft] of Object.entries(types)) {
      const val = clean[k];
      if (typeof val !== 'string' || !val) continue;
      if (ft === 'date/datetimeminute') clean[k] = val.slice(0, 16);
      else if (ft === 'date/date') clean[k] = val.slice(0, 10);
    }
  }
  return clean;
}

let _cachedUserProfile: Record<string, unknown> | null = null;

export async function getUserProfile(): Promise<Record<string, unknown>> {
  if (_cachedUserProfile) return _cachedUserProfile;
  const raw = await callApi('GET', '/user');
  const skip = new Set(['id', 'image', 'lang', 'gender', 'title', 'fax', 'menus', 'initials']);
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v != null && !skip.has(k)) data[k] = v;
  }
  _cachedUserProfile = data;
  return data;
}

export interface HeaderProfile {
  firstname: string;
  surname: string;
  email: string;
  image: string | null;
  company: string | null;
}

let _cachedHeaderProfile: HeaderProfile | null = null;

export async function getHeaderProfile(): Promise<HeaderProfile> {
  if (_cachedHeaderProfile) return _cachedHeaderProfile;
  const raw = await callApi('GET', '/user');
  _cachedHeaderProfile = {
    firstname: raw.firstname ?? '',
    surname: raw.surname ?? '',
    email: raw.email ?? '',
    image: raw.image ?? null,
    company: raw.company ?? null,
  };
  return _cachedHeaderProfile;
}

export interface AppGroupInfo {
  id: string;
  name: string;
  image: string | null;
  createdat: string;
  /** Resolved link: /objects/{id}/ if the dashboard exists, otherwise /gateway/apps/{firstAppId}?template=list_page */
  href: string;
}

let _cachedAppGroups: AppGroupInfo[] | null = null;

export async function getAppGroups(): Promise<AppGroupInfo[]> {
  if (_cachedAppGroups) return _cachedAppGroups;
  const raw = await callApi('GET', '/appgroups?with=apps');
  const groups: AppGroupInfo[] = Object.values(raw)
    .map((g: any) => {
      const firstAppId = Object.keys(g.apps ?? {})[0] ?? g.id;
      return {
        id: g.id,
        name: g.name,
        image: g.image ?? null,
        createdat: g.createdat ?? '',
        href: `/gateway/apps/${firstAppId}?template=list_page`,
        _firstAppId: firstAppId,
      };
    })
    .sort((a, b) => b.createdat.localeCompare(a.createdat));

  // Check which appgroups have a working dashboard at /objects/{id}/
  const checks = await Promise.allSettled(
    groups.map(g => fetch(`/objects/${g.id}/`, { method: 'HEAD', credentials: 'include' }))
  );
  checks.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.ok) {
      groups[i].href = `/objects/${groups[i].id}/`;
    }
  });

  // Clean up internal helper property
  groups.forEach(g => delete (g as any)._firstAppId);

  _cachedAppGroups = groups;
  return _cachedAppGroups;
}

export class LivingAppsService {
  // --- MEDIKAMENTENPLAN ---
  static async getMedikamentenplan(): Promise<Medikamentenplan[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MEDIKAMENTENPLAN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Medikamentenplan[];
    return enrichLookupFields(records, 'medikamentenplan');
  }
  static async getMedikamentenplanEntry(id: string): Promise<Medikamentenplan | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MEDIKAMENTENPLAN}/records/${id}`);
    const record = { record_id: data.id, ...data } as Medikamentenplan;
    return enrichLookupFields([record], 'medikamentenplan')[0];
  }
  static async createMedikamentenplanEntry(fields: Medikamentenplan['fields']) {
    return callApi('POST', `/apps/${APP_IDS.MEDIKAMENTENPLAN}/records`, { fields });
  }
  static async updateMedikamentenplanEntry(id: string, fields: Partial<Medikamentenplan['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.MEDIKAMENTENPLAN}/records/${id}`, { fields });
  }
  static async deleteMedikamentenplanEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.MEDIKAMENTENPLAN}/records/${id}`);
  }

  // --- KLIENTENSTAMMDATEN ---
  static async getKlientenstammdaten(): Promise<Klientenstammdaten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KLIENTENSTAMMDATEN}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Klientenstammdaten[];
    return enrichLookupFields(records, 'klientenstammdaten');
  }
  static async getKlientenstammdatenEntry(id: string): Promise<Klientenstammdaten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KLIENTENSTAMMDATEN}/records/${id}`);
    const record = { record_id: data.id, ...data } as Klientenstammdaten;
    return enrichLookupFields([record], 'klientenstammdaten')[0];
  }
  static async createKlientenstammdatenEntry(fields: Klientenstammdaten['fields']) {
    return callApi('POST', `/apps/${APP_IDS.KLIENTENSTAMMDATEN}/records`, { fields });
  }
  static async updateKlientenstammdatenEntry(id: string, fields: Partial<Klientenstammdaten['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.KLIENTENSTAMMDATEN}/records/${id}`, { fields });
  }
  static async deleteKlientenstammdatenEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.KLIENTENSTAMMDATEN}/records/${id}`);
  }

  // --- WUNDDOKUMENTATION ---
  static async getWunddokumentation(): Promise<Wunddokumentation[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.WUNDDOKUMENTATION}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Wunddokumentation[];
    return enrichLookupFields(records, 'wunddokumentation');
  }
  static async getWunddokumentationEntry(id: string): Promise<Wunddokumentation | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.WUNDDOKUMENTATION}/records/${id}`);
    const record = { record_id: data.id, ...data } as Wunddokumentation;
    return enrichLookupFields([record], 'wunddokumentation')[0];
  }
  static async createWunddokumentationEntry(fields: Wunddokumentation['fields']) {
    return callApi('POST', `/apps/${APP_IDS.WUNDDOKUMENTATION}/records`, { fields });
  }
  static async updateWunddokumentationEntry(id: string, fields: Partial<Wunddokumentation['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.WUNDDOKUMENTATION}/records/${id}`, { fields });
  }
  static async deleteWunddokumentationEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.WUNDDOKUMENTATION}/records/${id}`);
  }

  // --- VITALWERTE_ERFASSUNG ---
  static async getVitalwerteErfassung(): Promise<VitalwerteErfassung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.VITALWERTE_ERFASSUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as VitalwerteErfassung[];
    return enrichLookupFields(records, 'vitalwerte_erfassung');
  }
  static async getVitalwerteErfassungEntry(id: string): Promise<VitalwerteErfassung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.VITALWERTE_ERFASSUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as VitalwerteErfassung;
    return enrichLookupFields([record], 'vitalwerte_erfassung')[0];
  }
  static async createVitalwerteErfassungEntry(fields: VitalwerteErfassung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.VITALWERTE_ERFASSUNG}/records`, { fields });
  }
  static async updateVitalwerteErfassungEntry(id: string, fields: Partial<VitalwerteErfassung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.VITALWERTE_ERFASSUNG}/records/${id}`, { fields });
  }
  static async deleteVitalwerteErfassungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.VITALWERTE_ERFASSUNG}/records/${id}`);
  }

  // --- TOURENPLANUNG ---
  static async getTourenplanung(): Promise<Tourenplanung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.TOURENPLANUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Tourenplanung[];
    return enrichLookupFields(records, 'tourenplanung');
  }
  static async getTourenplanungEntry(id: string): Promise<Tourenplanung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.TOURENPLANUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as Tourenplanung;
    return enrichLookupFields([record], 'tourenplanung')[0];
  }
  static async createTourenplanungEntry(fields: Tourenplanung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.TOURENPLANUNG}/records`, { fields });
  }
  static async updateTourenplanungEntry(id: string, fields: Partial<Tourenplanung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.TOURENPLANUNG}/records/${id}`, { fields });
  }
  static async deleteTourenplanungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.TOURENPLANUNG}/records/${id}`);
  }

  // --- PFLEGEPLANUNG ---
  static async getPflegeplanung(): Promise<Pflegeplanung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEPLANUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Pflegeplanung[];
    return enrichLookupFields(records, 'pflegeplanung');
  }
  static async getPflegeplanungEntry(id: string): Promise<Pflegeplanung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEPLANUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as Pflegeplanung;
    return enrichLookupFields([record], 'pflegeplanung')[0];
  }
  static async createPflegeplanungEntry(fields: Pflegeplanung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.PFLEGEPLANUNG}/records`, { fields });
  }
  static async updatePflegeplanungEntry(id: string, fields: Partial<Pflegeplanung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.PFLEGEPLANUNG}/records/${id}`, { fields });
  }
  static async deletePflegeplanungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.PFLEGEPLANUNG}/records/${id}`);
  }

  // --- LEISTUNGSNACHWEIS ---
  static async getLeistungsnachweis(): Promise<Leistungsnachweis[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.LEISTUNGSNACHWEIS}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Leistungsnachweis[];
    return enrichLookupFields(records, 'leistungsnachweis');
  }
  static async getLeistungsnachwei(id: string): Promise<Leistungsnachweis | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.LEISTUNGSNACHWEIS}/records/${id}`);
    const record = { record_id: data.id, ...data } as Leistungsnachweis;
    return enrichLookupFields([record], 'leistungsnachweis')[0];
  }
  static async createLeistungsnachwei(fields: Leistungsnachweis['fields']) {
    return callApi('POST', `/apps/${APP_IDS.LEISTUNGSNACHWEIS}/records`, { fields });
  }
  static async updateLeistungsnachwei(id: string, fields: Partial<Leistungsnachweis['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.LEISTUNGSNACHWEIS}/records/${id}`, { fields });
  }
  static async deleteLeistungsnachwei(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.LEISTUNGSNACHWEIS}/records/${id}`);
  }

  // --- PFLEGEDURCHFUEHRUNG ---
  static async getPflegedurchfuehrung(): Promise<Pflegedurchfuehrung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEDURCHFUEHRUNG}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Pflegedurchfuehrung[];
    return enrichLookupFields(records, 'pflegedurchfuehrung');
  }
  static async getPflegedurchfuehrungEntry(id: string): Promise<Pflegedurchfuehrung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEDURCHFUEHRUNG}/records/${id}`);
    const record = { record_id: data.id, ...data } as Pflegedurchfuehrung;
    return enrichLookupFields([record], 'pflegedurchfuehrung')[0];
  }
  static async createPflegedurchfuehrungEntry(fields: Pflegedurchfuehrung['fields']) {
    return callApi('POST', `/apps/${APP_IDS.PFLEGEDURCHFUEHRUNG}/records`, { fields });
  }
  static async updatePflegedurchfuehrungEntry(id: string, fields: Partial<Pflegedurchfuehrung['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.PFLEGEDURCHFUEHRUNG}/records/${id}`, { fields });
  }
  static async deletePflegedurchfuehrungEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.PFLEGEDURCHFUEHRUNG}/records/${id}`);
  }

  // --- PFLEGEFACHKRAEFTE ---
  static async getPflegefachkraefte(): Promise<Pflegefachkraefte[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEFACHKRAEFTE}/records`);
    const records = Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    })) as Pflegefachkraefte[];
    return enrichLookupFields(records, 'pflegefachkraefte');
  }
  static async getPflegefachkraefteEntry(id: string): Promise<Pflegefachkraefte | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEFACHKRAEFTE}/records/${id}`);
    const record = { record_id: data.id, ...data } as Pflegefachkraefte;
    return enrichLookupFields([record], 'pflegefachkraefte')[0];
  }
  static async createPflegefachkraefteEntry(fields: Pflegefachkraefte['fields']) {
    return callApi('POST', `/apps/${APP_IDS.PFLEGEFACHKRAEFTE}/records`, { fields });
  }
  static async updatePflegefachkraefteEntry(id: string, fields: Partial<Pflegefachkraefte['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.PFLEGEFACHKRAEFTE}/records/${id}`, { fields });
  }
  static async deletePflegefachkraefteEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.PFLEGEFACHKRAEFTE}/records/${id}`);
  }

}