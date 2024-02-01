"use client"

import { ClipboardIcon, CheckIcon, ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";
import { useCopyToClipboard } from 'usehooks-ts'
import { Button } from "../button";
import { useState } from "react";
import { AnimatePresence, m } from "framer-motion";



export const Copy = ({ code }: { code: string }) => {

    const [_, copy] = useCopyToClipboard()

    const [copied, setCopied] = useState(false)


    return (
        <div className="w-12 flex items-end justify-center">
            <Button
                size="icon"
                variant="ghost"
                className="relative !w-8 !h-8 mr-1 text-on-surface-variant hover:text-on-surface"
                onClick={() => {
                    copy(code)
                    setCopied(true)
                    setTimeout(() => {
                        setCopied(false)
                    }, 2000)
                }}
            >
                <AnimatePresence initial={false}>
                    {copied ? (
                        <m.span
                            key="check"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        >
                            <ClipboardDocumentCheckIcon className="w-6 h-6 text-green-500" />
                        </m.span>
                    ) : (
                        <m.span
                            key="clipboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        >

                            <ClipboardDocumentIcon className="w-6 h-6" />
                        </m.span>

                    )}
                </AnimatePresence>

            </Button>
        </div>
    )
}
