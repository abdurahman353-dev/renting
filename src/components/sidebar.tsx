"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  Wrench
} from "lucide-react"
import { Children, useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { publicAPI } from "@/data/apis"


interface SidebarRoute {
  label: string;
  icon: any;
  href: string;
  color?: string;
  children?: {
    label: string;
    href: string;
  }[];
}

const defaultRoutes: SidebarRoute[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Properties",
    icon: Building2,
    href: "/properties",
    color: "text-violet-500",
  },
  {
    label: "Units",
    icon: Building2,
    href: "/units",
    color: "text-violet-500",
  },
  {
    label: "Tenants",
    icon: Users,
    href: "/tenants",
    color: "text-pink-700",
  },
  {
    label: "Finance",
    icon: CreditCard,
    href: "/finance",
    color: "text-orange-700",
    children: [
      {
        label: "Cashier",
        href: "/finance/cashier"
      },
      {
        label: "Finances",
        href: "/finance"
      },
      {
        label: "Transactions",
        href: "/finance/transactions"
      }
    ]
  },
  {
    label: "Repairs",
    icon: Wrench,
    href: "/repairs",
    color: "text-amber-500",
  },
]

const superAdminRoutes: SidebarRoute[] = [
  {
    label: "Reports",
    icon: FileText,
    href: "/reports",
    color: "text-emerald-500",
    children: [
      {
        label: "Property Report",
        href: "/reports/property",
      },
      {
        label: "Units Reports",
        href: "/reports/units",
      },
      {
        label: "Tenants Reports",
        href: "/reports/tenants",
      },
    ]
  },
  {
    label: "Activity",
    icon: FileText,
    href: "/activity",
    color: "text-emerald-500",
  },
  {
    label: "Admins",
    icon: Users,
    href: "/admins",
    color: "text-pink-700",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
    color: "text-slate-400",
  },
]

const pureSuperAdminRoutes: SidebarRoute[] = [
  {
    label: "SaaS Master Control",
    icon: LayoutDashboard,
    href: "/super-admin",
    color: "text-amber-400 font-bold",
  },
  {
    label: "Landing & Settings",
    icon: Settings,
    href: "/settings",
    color: "text-indigo-400",
  },
  {
    label: "Platform Activity",
    icon: FileText,
    href: "/activity",
    color: "text-emerald-400",
  },
  {
    label: "System Admins",
    icon: Users,
    href: "/admins",
    color: "text-pink-400",
  },
  {
    label: "Landlord Demo View",
    icon: Building2,
    href: "/dashboard",
    color: "text-slate-400",
  },
]

interface SidebarProps {
  isOpen: boolean
  isExpanded?: boolean
  setIsOpen: (open: boolean) => void
  routes?: SidebarRoute[]
}

export function Sidebar({ isOpen, isExpanded = true, setIsOpen, routes: propRoutes }: SidebarProps) {
  const pathname = usePathname()
  const { isSuperAdmin, user } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["/reports"])
  const [companyName, setCompanyName] = useState("")

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await publicAPI.getSettings();
        if (data && data.company_name) {
          setCompanyName(data.company_name);
        }
      } catch (err) {
        console.error("Failed to load sidebar settings:", err);
      }
    };
    fetchSettings();
  }, []);

  // If routes are passed as props, use them. 
  // Super Admin gets pure SaaS Owner navigation.
  const routes = propRoutes || (isSuperAdmin() ? pureSuperAdminRoutes : defaultRoutes)

  const toggleMenu = (href: string) => {
    if (!isExpanded) return; // Don't expand menus if sidebar is collapsed
    setExpandedMenus(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  const brandLetter = companyName ? companyName.charAt(0).toUpperCase() : "R";
  const displayTitle = companyName || "";

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "space-y-4 py-4 flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border fixed inset-y-0 left-0 z-[40] md:z-1 transition-all duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          isExpanded ? "w-64" : "w-20"
        )}
      >
        <div className="px-3 py-2 flex-1 overflow-y-auto sidebar-scrollbar overflow-x-hidden">
          <Link href="/dashboard" className={cn(
            "flex items-center mb-14 transition-all duration-300",
            isExpanded ? "pl-3" : "justify-center"
          )}>
            <div className="relative w-8 h-8 flex-shrink-0">
              {/* Logo placeholder */}
              <div className="absolute inset-0 bg-indigo-600 rounded-lg opacity-75 blur-sm animate-pulse"></div>
              <div className="relative bg-black rounded-lg w-full h-full flex items-center justify-center border border-slate-800">
                <span className="text-xl font-bold">{brandLetter}</span>
              </div>
            </div>
            {isExpanded && (
              <h1 className="text-2xl font-bold text-indigo-400 ml-4 whitespace-nowrap overflow-hidden transition-all duration-300">
                {displayTitle}
              </h1>
            )}
          </Link>
          <div className="space-y-1">
            {routes.map((route) => (
              <div key={route.href}>
                {route.children && isExpanded ? (
                  <>
                    <button
                      onClick={() => toggleMenu(route.href)}
                      className={cn(
                        "text-sm group flex p-3 w-full justify-between items-center font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                        pathname.startsWith(route.href) ? "text-white" : "text-zinc-400"
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <route.icon className={cn("h-5 w-5 flex-shrink-0", isExpanded ? "mr-3" : "", route.color)} />
                        {isExpanded && <span className="whitespace-nowrap">{route.label}</span>}
                      </div>
                      {isExpanded && (expandedMenus.includes(route.href) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      ))}
                    </button>
                    {expandedMenus.includes(route.href) && (
                      <div className="ml-9 mt-1 space-y-1 transition-all duration-300">
                        {route.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "text-sm group flex p-2 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                              pathname === child.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                          >
                            <span className="whitespace-nowrap">{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={route.href}
                    className={cn(
                      "text-sm group flex p-3 w-full font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300",
                      pathname === route.href ? "text-white bg-white/10" : "text-zinc-400",
                      isExpanded ? "justify-start" : "justify-center"
                    )}
                    title={!isExpanded ? route.label : undefined}
                  >
                    <div className={cn("flex items-center", isExpanded ? "flex-1" : "")}>
                      <route.icon className={cn("h-5 w-5 flex-shrink-0 transition-all", isExpanded ? "mr-3" : "", route.color)} />
                      {isExpanded && <span className="whitespace-nowrap">{route.label}</span>}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 py-2 transition-all duration-300">
          <div className={cn(
            "bg-slate-800/50 rounded-lg border border-slate-700 transition-all duration-300",
            isExpanded ? "p-3" : "p-2 flex justify-center"
          )}>
            {isExpanded ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-wider">
                    {user?.organization?.name || companyName || "SaaS Platform"}
                  </p>
                  <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase">
                    {user?.organization?.status === 'trial' ? 'Trial' : user?.role === 'super_admin' ? 'Super Admin' : 'SaaS'}
                  </span>
                </div>
                <p className="text-sm font-medium text-white truncate">{user?.name || "User"}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </>
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs text-white font-bold" title={user?.name}>
                {user?.name?.[0] || "U"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
