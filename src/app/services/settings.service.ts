import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

interface FeatureStorage {
  id: string;
  enabled: boolean;
}

interface AccessCodeStorage {
  id: string;
  value: string;
}

interface ReceiptSettings {
  enabled: boolean;
  email: string;
}

interface SocietySettings {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {

  private FEATURES_KEY = 'superadmin_features';
  private ACCESS_CODES_KEY = 'superadmin_access_codes';
  private RECEIPT_KEY = 'superadmin_receipt_settings';
  private SOCIETY_KEY = 'superadmin_society_settings';
 
  private defaultFeatures: Feature[] = [
     { id: 'hooper', title: "FEATURES.HOOPER.TITLE", description: "FEATURES.HOOPER.DESC", enabled: false },
    { id: 'recycleur', title: 'FEATURES.RECYCLER.TITLE', description: "FEATURES.RECYCLER.DESC", enabled: false },
  ];

  private defaultAccessCodes: AccessCode[] = [
    { id: 'admin_code', title: 'ACCESS.ADMIN.TITLE', value: '', description: "ACCESS.ADMIN.DESC" },
    { id: 'open_code', title: 'ACCESS.OPENDOOR.TITLE', value: '', description: "ACCESS.OPENDOOR.DESC" },
    { id: 'withdrawal_code', title: 'ACCESS.WITHDRAWAL.TITLE', value: '', description: "ACCESS.WITHDRAWAL.DESC" },
    { id: 'access_log_code', title: 'ACCESS.LOGS.TITLE', value: '', description: "ACCESS.LOGS.DESC" },
    { id: 'limit_withdrawal', title: 'ACCESS.WITHDRAWAL.LIMIT.TITLE', value: '', description: "ACCESS.WITHDRAWAL.LIMIT.DESC" }
  ];

  private featuresSubject = new BehaviorSubject<Feature[]>(this.loadFeatures(this.defaultFeatures));
  features$ = this.featuresSubject.asObservable();

  private accessCodesSubject = new BehaviorSubject<AccessCode[]>(this.loadAccessCodes(this.defaultAccessCodes));
  accessCodes$ = this.accessCodesSubject.asObservable();

  /** ==== Features ==== */
  saveFeatures(features: Feature[]) {
    const toStore = features.map(f => ({
      id: f.id,
      enabled: f.enabled
    }));

    localStorage.setItem(this.FEATURES_KEY, JSON.stringify(toStore));
    this.featuresSubject.next(features);
  }

  loadFeatures(defaults: Feature[]): Feature[] {
    const stored = localStorage.getItem(this.FEATURES_KEY);
    if (!stored) return defaults;

    const storedFeatures: FeatureStorage[] = JSON.parse(stored);

    return defaults.map(df => {
      const found = storedFeatures.find(sf => sf.id === df.id);
      return found
        ? { ...df, enabled: found.enabled }
        : df;
    });
  }


  /** ==== Access Codes ==== */
  saveAccessCodes(codes: AccessCode[]) {
    const toStore = codes.map(c => ({
      id: c.id,
      value: c.value
    }));

    localStorage.setItem(this.ACCESS_CODES_KEY, JSON.stringify(toStore));
    this.accessCodesSubject.next(codes);
  }

  loadAccessCodes(defaults: AccessCode[]): AccessCode[] {
    const stored = localStorage.getItem(this.ACCESS_CODES_KEY);
    if (!stored) return defaults;

    const storedCodes: AccessCodeStorage[] = JSON.parse(stored);

    return defaults.map(dc => {
      const found = storedCodes.find(sc => sc.id === dc.id);
      return found
        ? { ...dc, value: found.value }
        : dc;
    });
  }

  getFeature(id: string): Feature | undefined {
    return this.featuresSubject.getValue().find(f => f.id === id);
  }

  getAccessCode(id: string): AccessCode | undefined {
    return this.accessCodesSubject.getValue().find(c => c.id === id);
  }

  saveReceiptSettings(settings: ReceiptSettings) {
    localStorage.setItem(this.RECEIPT_KEY, JSON.stringify(settings));
  }

  loadReceiptSettings(): ReceiptSettings {
    
    const stored = localStorage.getItem(this.RECEIPT_KEY);

    if (!stored) {
      return {
        enabled: false,
        email: ''
      };
    }

    return JSON.parse(stored);
  }

  saveSocietySettings(settings: SocietySettings) {
    localStorage.setItem(this.SOCIETY_KEY, JSON.stringify(settings));
  }

  loadSocietySettings(): SocietySettings {
    
    const stored = localStorage.getItem(this.SOCIETY_KEY);

    if (!stored) {
      return {
        name: ''
      };
    }

    return JSON.parse(stored);
  }

}