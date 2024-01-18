import DatatrackSection from "./DatatrackSection";
import SyntenyRegion from "./SyntenyRegion";
import SyntenySection from "./SyntenySection";

export interface MenuItem {
  label: string,
  subtext?: string,
  icon?: string,
  command?: () => void;
  items?: MenuItem[];
}

export interface ContextMenuType {
  event: MouseEvent;
  region?: SyntenyRegion;
  section?: SyntenySection;
  track?: DatatrackSection;
}