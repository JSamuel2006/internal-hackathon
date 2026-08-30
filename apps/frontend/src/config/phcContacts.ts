/**
 * PHC / CHC / Government Health Facility Contact Configuration
 *
 * PURPOSE:
 * This file allows the deployment team to configure the nearest
 * Primary Health Centre (PHC), Community Health Centre (CHC), or
 * Government Health Facility for the specific deployment area.
 *
 * HOW TO CONFIGURE:
 * Replace `null` with the actual facility details for your deployment region.
 * The phone number is required for the Call PHC button to work.
 *
 * IMPORTANT:
 * - DO NOT deploy with placeholder or invented phone numbers.
 * - If no official phone number is available, set phone to null.
 * - The UI will gracefully show "PHC contact not configured" when this is null.
 *
 * EXAMPLE CONFIGURATION:
 * export const CONFIGURED_PHC: PHCContact = {
 *   name: 'Haveli Primary Health Centre',
 *   type: 'PHC',
 *   address: 'Haveli Village, Pune District, Maharashtra',
 *   phone: '9876543210',    // Only set if officially confirmed
 *   district: 'Pune',
 *   state: 'Maharashtra',
 *   emergencyAvailable: true,
 * };
 */

export interface PHCContact {
  name: string;
  type: 'PHC' | 'CHC' | 'District Hospital' | 'Sub-Centre';
  address: string;
  phone: string | null;   // null = no phone number confirmed
  district?: string;
  state?: string;
  emergencyAvailable?: boolean;
}

/**
 * Set this to your deployment area's nearest government health facility.
 * Set to `null` if no facility has been officially configured.
 */
export const CONFIGURED_PHC: PHCContact | null = null;
