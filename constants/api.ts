import { Platform } from 'react-native';

// API Configuration
// Web uses localhost, Physical Device uses IP, Emulator uses 10.0.2.2
export const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8080/api' 
  : 'http://192.168.1.12:8080/api';

export const LARAVEL_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : 'http://192.168.1.12:8000';

// Midtrans Snap URL (sandbox)
export const MIDTRANS_SNAP_URL = 'https://app.sandbox.midtrans.com/snap/v3/redirection';

// WhatsApp
export const WHATSAPP_NUMBER = '6281945122202';
export const STORE_NAME = 'Sinar Abadi';
export const STORE_ADDRESS = 'Jalan Utara Masjid No.9, Dampit Wetan, Dampit, Kec. Dampit, Kabupaten Malang, Jawa Timur 65181';
export const STORE_PHONE = '+62 819-4512-2202';

// Bank Transfer info (manual payment)
export const BANK_TRANSFER = {
  bank: 'Mandiri',
  accountNumber: '1234567890', // TODO: Update with actual account number
  accountName: 'Sinar Abadi',  // TODO: Update with actual name
};

// Biteship couriers
export const BITESHIP_COURIERS = 'jne,sicepat,jnt';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 12;
