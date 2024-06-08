"use client"

import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { Link } from "@pixeleye/ui/src/link";
import { cx } from "class-variance-authority";
import { useState, useCallback, useEffect } from "react";


type Heading = {
    title: string;
    id: string;
    children: {
        title: string;
        id: string;
    }[];
}

export function HeadingNav({ headings, githubURL }: { headings: Heading[], githubURL: string }) {


    const [currentSection, setCurrentSection] = useState(headings[0]?.id);


    let getHeadings = useCallback((headings: {
        title: string;
        id: string;
        children: {
            title: string;
            id: string;
        }[];
    }[]) => {
        return headings
            .flatMap((node) => [node.id, ...node.children.map((child) => child.id)])
            .map((id) => {
                let el = document.getElementById(id.replace("?", ""))
                if (!el) return null

                let style = window.getComputedStyle(el)
                let scrollMt = parseFloat(style.scrollMarginTop)

                let top = window.scrollY + el.getBoundingClientRect().top - scrollMt
                return { id, top }
            })
            .filter((x): x is { id: string; top: number } => x !== null)
    }, [])

    useEffect(() => {
        if (headings.length === 0) return
        let elHeadings = getHeadings(headings)
        function onScroll() {
            let top = window.scrollY
            let current = elHeadings[0].id
            for (let heading of elHeadings) {
                if (top >= heading.top - 10) {
                    current = heading.id
                } else {
                    break
                }
            }
            setCurrentSection(current)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()
        return () => {
            window.removeEventListener('scroll', onScroll)
        }
    }, [getHeadings, headings])

    const isActive = (section: Heading | {
        id: string;
        children: undefined;
        title: string;
    }) => {
        if (section.id === currentSection) {
            return true
        }
        if (!section.children) {
            return false
        }
        return section.children.findIndex(isActive as any) > -1
    }


    return (

        <nav aria-labelledby="on-this-page-title" className="w-56">
            {headings.length > 0 && (
                <>
                    <h2
                        id="on-this-page-title"
                        className="font-display text-sm font-medium text-slate-900 dark:text-white"
                    >
                        On this page
                    </h2>
                    <ol role="list" className="mt-4 space-y-3 text-sm">
                        {headings.map((section) => (
                            <li key={section.id}>
                                <h3>
                                    <a
                                        href={`#${section.id}`}
                                        className={cx(
                                            isActive(section)
                                                ? "text-tertiary"
                                                : "font-normal text-on-surface-variant hover:text-on-surface"
                                        )}
                                    >
                                        {section.title}
                                    </a>
                                </h3>
                                {section.children.length > 0 && (
                                    <ol
                                        role="list"
                                        className="mt-2 space-y-3 pl-5 text-on-surface-variant"
                                    >
                                        {section.children.map((subSection: any) => (
                                            <li key={subSection.id}>
                                                <a
                                                    href={`#${subSection.id}`}
                                                    className={
                                                        isActive(subSection)
                                                            ? "text-tertiary"
                                                            : "text-on-surface-variant hover:text-on-surface"
                                                    }
                                                >
                                                    {subSection.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </li>
                        ))}
                    </ol>
                    <hr className="border-outline-variant my-4" />
                    <Link
                        size="sm"
                        href={githubURL}
                        rel="noopener noreferrer"
                        variant="text"
                        target="_blank"
                        className="!text-sm flex items-center"
                    >
                        Edit this page on GitHub <ArrowUpRightIcon className="ml-1 mt-px" height="1em" width="1em" />
                    </Link>
                </>
            )}
        </nav>
    )
}