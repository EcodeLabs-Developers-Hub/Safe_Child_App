declare module 'lucide-react' {
  import type { ComponentType, SVGProps } from 'react';
  type Icon = ComponentType<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>;
  export const Activity: Icon;
  export const AlertTriangle: Icon;
  export const BarChart3: Icon;
  export const Check: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const FileImage: Icon;
  export const FolderOpen: Icon;
  export const LayoutDashboard: Icon;
  export const LogOut: Icon;
  export const Menu: Icon;
  export const Search: Icon;
  export const Shield: Icon;
  export const Users: Icon;
  export const X: Icon;
}