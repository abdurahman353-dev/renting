"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const { user } = useAuth()

    const handleThemeChange = async () => {
        const newTheme = theme === "light" ? "dark" : "light"
        setTheme(newTheme)

        if (user) {
            try {
                await api.post('user/theme', { theme: newTheme })
            } catch (error) {
                console.error("Failed to sync theme preference", error)
            }
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleThemeChange}
            className="rounded-full w-9 h-9 border border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
            title="Toggle theme"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
