export type MemberStatus = 'active' | 'expiring_soon' | 'expired';
export type SessionType = 'daily' | 'monthly';
export type PaymentType = 'daily' | 'monthly';

export interface Member {
  id: string; 
  member_id: string; 
  full_name: string;
  phone: string;
  emergency_phone: string;
  date_of_birth: string; 
  pin_hash: string;
  status: MemberStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceLog {
  id: string;
  log_type: SessionType;
  member_id: string | null;
  visitor_name: string; 
  created_at: string;
}

export interface Payment {
  id: string;
  member_id: string | null;
  payer_name: string;
  tx_type: PaymentType; 
  amount: number;
  created_at: string;
}

export interface GymSettings {
  id: number;
  gym_name: string;
  operating_hours: string;
  daily_fee: number;
  monthly_fee: number;
  admin_password: string;
  updated_at: string;
}