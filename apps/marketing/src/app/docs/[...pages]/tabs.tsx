"use client";

import { Tabs, TabsList, TabsContent, TabsTrigger } from "@pixeleye/ui";
import { usePathname } from "next/navigation"
import { create } from "zustand";
import { useEffect } from "react";

interface TabStore {
    currentTab: {
        [key: string]: string
    }
    setCurrentTab: (group: string, tab: string) => void
}

export const useTabStore = create<TabStore>()((set) => ({
    currentTab: {},
    setCurrentTab: (group: string, tab: string) => {
        localStorage.setItem(`doc-tabs:${group}`, tab);
        set((state) => ({
            currentTab: {
                ...state.currentTab,
                [group]: tab
            }
        }))
    }
}));

export function TabsRender({ children, labels }: {
    children: React.ReactNode
    labels: string[]
}) {

    const group = labels.sort().toString();

    const currentTab = useTabStore((state) => state.currentTab[group]);
    const setCurrentTab = useTabStore((state) => state.setCurrentTab);

    useEffect(() => {
        if (!currentTab) {
            const newTab = localStorage.getItem(`doc-tabs:${group}`) || labels[0];
            setCurrentTab(group, newTab);
        } else if (!labels.includes(currentTab)) {
            setCurrentTab(group, labels[0]);
        }
    }, [currentTab, group, labels, setCurrentTab]);


    return (
        <Tabs value={currentTab} defaultValue={labels[0]} onValueChange={(tab) => setCurrentTab(group, tab)}>
            <TabsList>
                {labels.map((label: string) => (
                    <TabsTrigger value={label} key={label}>
                        {label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {children}
        </Tabs>
    );
}

export function TabRender({ children, label }: {
    children: React.ReactNode
    label: string
}) {

    return (
        <TabsContent value={label}>
            {children}
        </TabsContent>
    );
}