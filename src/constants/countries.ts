export interface Country {
  code: string; // identifiant interne TermChat, ex: "TC01" (plus un indicatif telephonique)
  flag: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: 'TC01', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'TC02', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'TC03', flag: '🇬🇳', name: 'Guinée' },
  { code: 'TC04', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'TC05', flag: '🇬🇭', name: 'Ghana' },
  { code: 'TC06', flag: '🇲🇱', name: 'Mali' },
  { code: 'TC07', flag: '🇹🇬', name: 'Togo' },
  { code: 'TC08', flag: '🇧🇯', name: 'Bénin' },
  { code: 'TC09', flag: '🇳🇪', name: 'Niger' },
  { code: 'TC10', flag: '🇳🇬', name: 'Nigéria' },
  { code: 'TC11', flag: '🇨🇲', name: 'Cameroun' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];
