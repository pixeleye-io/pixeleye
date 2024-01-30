import { Button, Link } from "@pixeleye/ui";
import { getFiles } from "./layout";
import { Section } from "./docsNav";
import NextLink from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";


function PageLink({
    label,
    page,
    previous = false,
}: {
    label: string
    page: { href: string; title: string }
    previous?: boolean
}) {



    return (
        <>
            <Link
                asChild
                variant="text"
            >
                <NextLink
                    href={page.href}
                    aria-label={`${label}: ${page.title}`}
                    className="not-prose !text-on-surface hover:!text-tertiary capitalize flex space-x-2 items-center justify-center"
                >
                    {
                        previous && (
                            <ArrowLeftIcon className=" w-5 h-5 mr-2" />
                        )}
                    {page.title}

                    {
                        !previous && (
                            <ArrowRightIcon className=" w-5 h-5 ml-2" />
                        )}
                </NextLink>
            </Link>
        </>
    )
}



export async function PageNavigation(
    {
        currentPageURL
    }: {
        currentPageURL: string

    }
) {

    const sections = (await getFiles()).flatMap((group) => group.links)

    let currentPageIndex = sections.findIndex((page) => page.href === currentPageURL)

    if (currentPageIndex === -1) {
        return null
    }

    const previousPage = sections[currentPageIndex - 1]
    const nextPage = sections[currentPageIndex + 1]

    if (!previousPage && !nextPage) {
        return null
    }

    return (
        <div className="flex py-8">
            {previousPage && (
                <div className="flex flex-col items-start gap-3">
                    <PageLink label="Previous" page={previousPage} previous />
                </div>
            )}
            {nextPage && (
                <div className="ml-auto flex flex-col items-end gap-3">
                    <PageLink label="Next" page={nextPage} />
                </div>
            )}
        </div>
    )
}