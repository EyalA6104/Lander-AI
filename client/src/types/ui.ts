import { LucideIcon } from 'lucide-react';

export type ScreenState = 'landing' | 'launch' | 'warp' | 'neural' | 'results';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
}

export interface MissionMetric {
  label: string;
  value: string;
  percentage: number;
  color: string;
}

export interface StrategicManeuver {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel: string;
  color: string;
}

export interface DiagnosticMetric {
  name: string;
  status: 'Excellent' | 'Nominal' | 'Heavy';
  delta: string;
  impact: string;
  rawData: string;
  color: string;
}
