import { Tabs, TabsList, TabsContent, TabsTrigger } from "@pixeleye/ui";


export function TabsRender({ children, labels }: {
    children: React.ReactNode
    labels: string[]
}) {

    return (
        <Tabs>

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