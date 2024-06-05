import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@pixeleye/ui/src/select";


export function ThemeSwitcher() {
    const [mounted, setMounted] = useState(false)

    // Avoids hydration mismatch

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted)
        return <span className="w-24" />


    const theme = localStorage.getItem('theme') || 'system'


    const setTheme = (theme: string) => {
        console.log("theme", theme)
        localStorage.setItem('theme', theme)
        document.documentElement.classList.remove('dark')


        const resolvedTheme = theme === 'system' ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' : theme

        document.documentElement.style.colorScheme = resolvedTheme
        document.documentElement.classList.toggle('dark', resolvedTheme === 'dark')
    }

    return (
        <Select defaultValue={theme} onValueChange={(theme) => setTheme(theme)}>
            <SelectTrigger aria-label="Theme switcher" className="!w-24">
                <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}