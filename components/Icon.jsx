import {
  Truck,
  Clock,
  FileText,
  TrendingUp,
  Users,
  Award,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ChevronDown,
  Building2,
  Leaf,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

/** Named icons so content (and the admin panel) can reference an icon by string. */
const ICONS = {
  truck: Truck,
  clock: Clock,
  'file-text': FileText,
  'trending-up': TrendingUp,
  users: Users,
  award: Award,
  'map-pin': MapPin,
  mail: Mail,
  phone: Phone,
  'arrow-right': ArrowRight,
  'chevron-down': ChevronDown,
  building: Building2,
  leaf: Leaf,
  shield: ShieldCheck,
  calendar: Calendar,
};

export const ICON_NAMES = Object.keys(ICONS);

export default function Icon({ name, className, ...props }) {
  const Cmp = ICONS[name] || Truck;
  return <Cmp className={className} {...props} />;
}
