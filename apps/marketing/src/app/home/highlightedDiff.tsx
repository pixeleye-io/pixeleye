"use client"

import DarkScreenshot from "./assets/dark-screenshot.png";
import LightScreenshot from "./assets/light-screenshot.png";
import DarkDiff from "./assets/dark-diff.png";
import LightDiff from "./assets/light-diff.png";
import Image from "next/image";
import { Label, Switch } from "@pixeleye/ui";
import { useState } from "react";


export function HighlightedDiff() {

    const [showDiff, setShowDiff] = useState(true);

    return (
        <div className="bg-surface py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl sm:text-center">
                    <h2 className="text-base font-semibold leading-7 text-tertiary">Highlighted Visual Regressions</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                        Catch unintended visual changes
                    </p>
                    <p className="mt-6 text-lg leading-8 text-on-surface-variant">
                        Ever changed a line of css only to have a completely different part of your app break?
                        Pixeleye catches these changes making it easier for you and your team to review and approve changes.
                    </p>
                </div>
            </div>
            <div className=" flex  max-w-7xl  items-center justify-end mx-auto space-x-4 px-6 lg:px-8 mt-12">
                <Label htmlFor="diffSwitch">
                    Difference overlay
                </Label>
                <Switch id="diffSwitch" checked={showDiff} onCheckedChange={setShowDiff} />
            </div>
            <div className="relative overflow-hidden pt-4">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="relative z-0 dark:hidden" style={{
                        aspectRatio: LightScreenshot.width / LightScreenshot.height
                    }}>
                        <Image
                            src={LightScreenshot}
                            alt="Light screenshot"
                            className="z-0 absolute inset-0" />
                        {
                            showDiff && (
                                <>
                                    <Image
                                        src={LightDiff}
                                        alt="Light difference overlay"
                                        className="absolute inset-0 z-20" />
                                    <span className="absolute inset-0 z-10 bg-black/5 rounded ml-0.5" />
                                </>
                            )
                        }
                    </div>
                    <div className="relative z-0 dark:block hidden" style={{
                        aspectRatio: DarkScreenshot.width / DarkScreenshot.height
                    }}>
                        <Image
                            src={DarkScreenshot}
                            alt="Dark screenshot"
                            className="z-0 absolute inset-0" />
                        {
                            showDiff && (
                                <>
                                    <Image
                                        src={DarkDiff}
                                        alt="Dark difference overlay"
                                        className="absolute inset-0 z-20" />
                                    <span className="absolute inset-0 z-10 bg-black/20 rounded ml-0.5" />
                                </>
                            )
                        }
                    </div>
                    <div className="relative" aria-hidden="true">
                        <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-surface pt-[7%]" />
                    </div>

                </div>
            </div>
            <p className="mt-12 text-center text-lg text-tertiary">
                How many did you spot? <span className="text-on-surface-variant">Imagine manually doing this across your entire app after every change!</span>
            </p>
        </div>
    )
}