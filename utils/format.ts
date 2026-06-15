import { StatusColors } from '../constants/theme';
import { WHATSAPP_NUMBER } from '../constants/api';

/**
 * Format number as Rupiah currency
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price).replace('Rp', 'Rp ');
};

/**
 * Format date string to Indonesian locale
 */
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format date with time
 */
export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get status badge properties (color & label)
 */
export const getStatusBadge = (status: string) => {
  return StatusColors[status] || StatusColors['pending'];
};

/**
 * Build WhatsApp deep link with encoded message
 */
export const getWhatsAppLink = (productName?: string): string => {
  let message = 'Halo Sinar Abadi, ';
  if (productName) {
    message += `saya tertarik dengan produk "${productName}". Bisa info lebih lanjut?`;
  } else {
    message += 'saya ingin bertanya tentang produk yang tersedia.';
  }
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

/**
 * Format weight in grams to readable string
 */
export const formatWeight = (grams: number): string => {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} kg`;
  }
  return `${grams} g`;
};

/**
 * Format dimensions (cm)
 */
export const formatDimensions = (l: number, w: number, h: number): string | null => {
  if (l <= 1 && w <= 1 && h <= 1) return null;
  return `${l} × ${w} × ${h} cm`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

import { API_BASE_URL } from '../constants/api';

/**
 * Fix image URLs from DB (replaces localhost:8000 with the active Go Backend URL)
 */
export const fixImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.includes('http://localhost:8000')) {
    const backendHost = API_BASE_URL.replace('/api', '');
    return url.replace('http://localhost:8000', backendHost);
  }
  return url;
};
