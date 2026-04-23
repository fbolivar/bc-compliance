import {
  Compass, Lightbulb, Shield, Megaphone, Globe, Network, Map,
  Leaf, Scale, Users, UserCheck, DollarSign, Building, Folder,
  FileSignature, Gavel, Headphones, ShieldCheck, ClipboardCheck,
  ClipboardList, Target, Wrench, CheckSquare, Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Maps the `icon` text we stored in asset_categories.icon → the Lucide component. */
const ICON_MAP: Record<string, LucideIcon> = {
  // Family icons
  compass: Compass,
  target: Target,
  wrench: Wrench,
  'clipboard-list': ClipboardList,
  'check-square': CheckSquare,
  // Process icons
  lightbulb: Lightbulb,
  shield: Shield,
  megaphone: Megaphone,
  globe: Globe,
  network: Network,
  map: Map,
  leaf: Leaf,
  scale: Scale,
  users: Users,
  'user-check': UserCheck,
  'dollar-sign': DollarSign,
  building: Building,
  folder: Folder,
  'file-signature': FileSignature,
  gavel: Gavel,
  headphones: Headphones,
  'shield-check': ShieldCheck,
  'clipboard-check': ClipboardCheck,
};

interface Props {
  name: string | null;
  className?: string;
}

export function ProcessIcon({ name, className }: Props) {
  const Icon = (name && ICON_MAP[name]) || Layers;
  return <Icon className={className} aria-hidden="true" />;
}
