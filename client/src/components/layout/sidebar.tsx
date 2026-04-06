import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Store,
  CreditCard,
  Users,
  Receipt,
  UserPlus,
  Headphones,
  Wrench,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Shop Management", href: "/shops", icon: Store },
  { name: "License", href: "/license", icon: Store },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Users", href: "/shop-users", icon: Users },
  { name: "Office Expenses", href: "/expenses", icon: Receipt },
  { name: "Referrals", href: "/referrals", icon: UserPlus },
  { name: "Support", href: "/support", icon: Headphones },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={cn(
        "fixed md:relative z-50 w-72 bg-card border-r border-border h-screen transition-transform duration-300",
        isMobile && !isOpen && "-translate-x-full",
        isMobile && isOpen && "translate-x-0"
      )}
    >
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Store className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="text-app-title">
              POS SaaS Admin
            </h1>
            <p className="text-sm text-muted-foreground">Super Admin Panel</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <button
                onClick={isMobile ? onClose : undefined}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </button>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
