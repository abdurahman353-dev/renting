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
  ChevronRight
} from "lucide-react"
import { Children, useState } from "react"


const defaultRoutes = [
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
      }
    ]
  },
  {
    label: "Reports",
    icon: FileText,
    href: "/reports",
    color: "text-emerald-500",
    children: [
      {
        label: "Units Reports",
        href: "/reports/units",
      },
      {
        label: "Tenants Reports",
        href: "/reports/tenants",
      },
    ]
  }
  // {
  //   label: "Settings",
  //   icon: Settings,
  //   href: "/settings",
  // },
]

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

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  routes?: SidebarRoute[]
}

export function Sidebar({ isOpen, setIsOpen, routes = defaultRoutes }: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["/reports"])

  const toggleMenu = (href: string) => {
    setExpandedMenus(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    )
  }

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "space-y-4 py-4 flex flex-col h-full bg-slate-900 text-white w-64 fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="px-3 py-2 flex-1 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center pl-3 mb-14">
            <div className="relative w-8 h-8 mr-4">
              {/* Logo placeholder */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg opacity-75 blur-sm animate-pulse"></div>
              <div className="relative bg-black rounded-lg w-full h-full flex items-center justify-center border border-slate-800">
                <span className="text-xl font-bold">R</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              RentSys
            </h1>
          </Link>
          <div className="space-y-1">
            {routes.map((route) => (
              <div key={route.href}>
                {route.children ? (
                  <>
                    <button
                      onClick={() => toggleMenu(route.href)}
                      className={cn(
                        "text-sm group flex p-3 w-full justify-between items-center font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                        pathname.startsWith(route.href) ? "text-white" : "text-zinc-400"
                      )}
                    >
                      <div className="flex items-center flex-1">
                        <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                        {route.label}
                      </div>
                      {expandedMenus.includes(route.href) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    {expandedMenus.includes(route.href) && (
                      <div className="ml-9 mt-1 space-y-1">
                        {route.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "text-sm group flex p-2 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                              pathname === child.href ? "text-white bg-white/10" : "text-zinc-400"
                            )}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={route.href}
                    className={cn(
                      "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-white hover:bg-white/10 rounded-lg transition",
                      pathname === route.href ? "text-white bg-white/10" : "text-zinc-400"
                    )}
                  >
                    <div className="flex items-center flex-1">
                      <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                      {route.label}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Logged in as</p>
            <p className="text-sm font-medium text-white">Admin User</p>
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
