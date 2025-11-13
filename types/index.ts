export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface EncryptedNote {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'incident' | 'medical' | 'legal' | 'other';
}

export interface AppSettings {
  emergencyContacts: EmergencyContact[];
  notes: EncryptedNote[];
  isFirstLaunch: boolean;
}
