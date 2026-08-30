/**
 * Official Indian National Emergency Numbers
 * Source: Government of India / MoHFW / EMRI / Telecom Regulatory Authority of India
 *
 * These are officially published, toll-free, publicly known emergency contact numbers
 * valid across most or all Indian states.
 *
 * NOTE: 108 (Ambulance/EMRI) coverage may vary by state. In some states it is
 * operated by state governments under different contracts but the same number.
 */

export interface EmergencyContactConfig {
  label: string;
  phone: string;
  description: string;
  icon: string;
  color: string; // Tailwind bg class
}

export const EMERGENCY_CONTACTS: Record<string, EmergencyContactConfig> = {
  ambulance: {
    label: 'Ambulance',
    phone: '108',
    description: 'Free National Ambulance (EMRI)',
    icon: '🚑',
    color: 'bg-rose-600',
  },
  national: {
    label: 'Emergency',
    phone: '112',
    description: 'National Emergency Number (All Services)',
    icon: '🆘',
    color: 'bg-red-700',
  },
  police: {
    label: 'Police',
    phone: '100',
    description: 'National Police Helpline',
    icon: '👮',
    color: 'bg-blue-700',
  },
  fire: {
    label: 'Fire',
    phone: '101',
    description: 'National Fire Service',
    icon: '🔥',
    color: 'bg-orange-600',
  },
  womenSOS: {
    label: 'Women SOS',
    phone: '1091',
    description: 'Women in Distress Helpline',
    icon: '🆘',
    color: 'bg-pink-600',
  },
  poisonControl: {
    label: 'Poison Control',
    phone: '1800-116-117',
    description: 'National Poison Control Centre (Toll-Free)',
    icon: '☠️',
    color: 'bg-purple-700',
  },
};

/**
 * Primary numbers to surface prominently in the offline emergency UI.
 * These are the most commonly needed rural health emergency numbers.
 */
export const PRIMARY_EMERGENCY_NUMBERS: Array<keyof typeof EMERGENCY_CONTACTS> = [
  'ambulance',
  'national',
];
