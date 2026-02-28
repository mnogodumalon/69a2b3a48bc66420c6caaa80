// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { Klientenstammdaten, Pflegefachkraefte, Medikamentenplan, Pflegeplanung, Tourenplanung, VitalwerteErfassung, Wunddokumentation, Pflegedurchfuehrung, Leistungsnachweis } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
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

export class LivingAppsService {
  // --- KLIENTENSTAMMDATEN ---
  static async getKlientenstammdaten(): Promise<Klientenstammdaten[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.KLIENTENSTAMMDATEN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getKlientenstammdatenEntry(id: string): Promise<Klientenstammdaten | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.KLIENTENSTAMMDATEN}/records/${id}`);
    return { record_id: data.id, ...data };
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

  // --- PFLEGEFACHKRAEFTE ---
  static async getPflegefachkraefte(): Promise<Pflegefachkraefte[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEFACHKRAEFTE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getPflegefachkraefteEntry(id: string): Promise<Pflegefachkraefte | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEFACHKRAEFTE}/records/${id}`);
    return { record_id: data.id, ...data };
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

  // --- MEDIKAMENTENPLAN ---
  static async getMedikamentenplan(): Promise<Medikamentenplan[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.MEDIKAMENTENPLAN}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getMedikamentenplanEntry(id: string): Promise<Medikamentenplan | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.MEDIKAMENTENPLAN}/records/${id}`);
    return { record_id: data.id, ...data };
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

  // --- PFLEGEPLANUNG ---
  static async getPflegeplanung(): Promise<Pflegeplanung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEPLANUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getPflegeplanungEntry(id: string): Promise<Pflegeplanung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEPLANUNG}/records/${id}`);
    return { record_id: data.id, ...data };
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

  // --- TOURENPLANUNG ---
  static async getTourenplanung(): Promise<Tourenplanung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.TOURENPLANUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getTourenplanungEntry(id: string): Promise<Tourenplanung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.TOURENPLANUNG}/records/${id}`);
    return { record_id: data.id, ...data };
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

  // --- VITALWERTE_ERFASSUNG ---
  static async getVitalwerteErfassung(): Promise<VitalwerteErfassung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.VITALWERTE_ERFASSUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getVitalwerteErfassungEntry(id: string): Promise<VitalwerteErfassung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.VITALWERTE_ERFASSUNG}/records/${id}`);
    return { record_id: data.id, ...data };
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

  // --- WUNDDOKUMENTATION ---
  static async getWunddokumentation(): Promise<Wunddokumentation[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.WUNDDOKUMENTATION}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getWunddokumentationEntry(id: string): Promise<Wunddokumentation | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.WUNDDOKUMENTATION}/records/${id}`);
    return { record_id: data.id, ...data };
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

  // --- PFLEGEDURCHFUEHRUNG ---
  static async getPflegedurchfuehrung(): Promise<Pflegedurchfuehrung[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEDURCHFUEHRUNG}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getPflegedurchfuehrungEntry(id: string): Promise<Pflegedurchfuehrung | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.PFLEGEDURCHFUEHRUNG}/records/${id}`);
    return { record_id: data.id, ...data };
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

  // --- LEISTUNGSNACHWEIS ---
  static async getLeistungsnachweis(): Promise<Leistungsnachweis[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.LEISTUNGSNACHWEIS}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getLeistungsnachwei(id: string): Promise<Leistungsnachweis | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.LEISTUNGSNACHWEIS}/records/${id}`);
    return { record_id: data.id, ...data };
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

}