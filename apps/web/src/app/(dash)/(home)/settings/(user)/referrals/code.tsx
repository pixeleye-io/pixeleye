"use client"

import { InputBase, Button } from "@pixeleye/ui"
import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { API } from "@/libs"

export function Code(
    {
        code
    }: {
        code: string
    }
) {


    const [copied, setCopied] = useState(false);

    const [value, setValue] = useState("")

    useEffect(() => {
        if (copied) {
            const timeout = setTimeout(() => {
                setCopied(false);
            }, 2000);

            return () => {
                clearTimeout(timeout);
            };
        }
    }, [copied]);


    const { mutate, error } = useMutation({
        mutationFn: (code: string) => API.post("/v1/user/refer", {
            body: {
                userID: code
            }
        }),
        onSuccess() {
            setValue("")
        },
    });

    return (
        <div className="mt-8 flex flex-col space-y-4">
            <div className="flex space-x-4 rounded-md  border-outline-variant p-4 overflow-hidden">
                <div className="flex flex-col justify-around flex-1 max-w-full">
                    <div className="w-full flex space-x-2">
                        <p className="whitespace-nowrap text-base pb-4">Your code, share this with friends</p>
                    </div>

                    <div className="flex space-x-2 sm:items-center flex-col sm:flex-row">
                        <InputBase value={code} readOnly />
                        <Button
                            onClick={() => {
                                setCopied(true);
                                navigator.clipboard.writeText(code);
                            }}
                            variant="secondary"
                            className="shrink-0 mt-2 sm:mt-0 !ml-auto sm:!ml-2"
                        >
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                    </div>

                </div>
            </div>
            {
                error && (
                    <p className="text-error">
                        {typeof error === "object" ? JSON.stringify(error) : error}
                    </p>
                )
            }
            <div className="flex space-x-4 rounded-md border-outline-variant p-4 overflow-hidden">
                <div className="flex flex-col justify-around flex-1 max-w-full">
                    <div className="w-full flex space-x-2">
                        <p className="whitespace-nowrap text-base pb-4">Have a code? Enter it here</p>
                    </div>

                    <div className="flex space-x-2 sm:items-center flex-col sm:flex-row">
                        <InputBase aria-label="Friends code" name="code" value={value} onChange={(e) => setValue(e.target.value)} />
                        <Button
                            variant="secondary"
                            onClick={() => mutate(value)}
                            className="shrink-0 mt-2 sm:mt-0 !ml-auto sm:!ml-2"
                        >
                            Get free snaps
                        </Button>
                    </div>

                </div>
            </div>
        </div >
    )
}