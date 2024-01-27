import { NodeProps } from "reactflow";
import { Avatar, Popover, PopoverTrigger, PopoverContent, Button, ScrollArea } from "@pixeleye/ui";

export interface ChatNodeData {
    avatarURL?: string;
    author?: string;
}


function NewComment({
    avatarURL,
    author
}: {
    avatarURL?: string;
    author?: string
}) {
    return (

        <form action="#" className="relative flex-auto">
            <div className="overflow-hidden">
                <label htmlFor="comment" className="sr-only">
                    Add your comment
                </label>
                <textarea
                    rows={3}
                    name="comment"
                    id="comment"
                    className="block w-full resize-none p-1 border rounded-lg bg-transparent py-1.5 text-on-surface outline-none border-outline placeholder:text-on-surface-variant sm:text-sm sm:leading-6"
                    placeholder="Add your comment..."
                    defaultValue={''}
                />
            </div>

            <div className="flex justify-end pt-2 pl-3 pr-2">
                <Button
                    type="submit"
                    size="sm"
                >
                    Comment
                </Button>
            </div>
        </form>
    )
}

function Comments({
    comments
}: {
    comments: {
        content: string;
        authorURL?: string;
        author?: string;
        createdAt: string;
    }[]
}) {


    return (
        <ul role="list" className="space-y-4 flex flex-col">
            {comments.map((comment, i) => (
                <li key={i} className="flex">
                    <div className="flex-shrink-0">
                        <Avatar className="!w-6 !h-6">
                            <Avatar.Image alt={`${comment.author || "unknown"}'s profile picture`} src={comment.authorURL ?? ""} />
                            <Avatar.Fallback className="!text-xs bg-tertiary-container text-on-tertiary-container">
                                {comment.author?.charAt(0).toUpperCase() || "U"}
                            </Avatar.Fallback>
                        </Avatar>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-on-surface">{comment.author}</p>
                        <div className="mt-1 text-sm text-on-surface-variant">
                            <p>{comment.content}</p>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    )
}

export function ChatNode({ data: {
    avatarURL,
    author

} }: NodeProps<ChatNodeData>) {

    return (
        <Popover>
            <PopoverTrigger onClick={(e) => e.stopPropagation()}>
                <div className="scale-90 origin-bottom-left transition hover:scale-100 rounded-[9999px_9999px_9999px_0px] h-8 w-8 border border-outline flex items-center justify-center bg-tertiary z-50 -translate-y-full">
                    <Avatar className="!w-6 !h-6">
                        <Avatar.Image alt={`${author || "unknown"}'s profile picture`} src={avatarURL ?? ""} />
                        <Avatar.Fallback className="!text-xs bg-tertiary-container text-on-tertiary-container">
                            {author?.charAt(0).toUpperCase() || "U"}
                        </Avatar.Fallback>
                    </Avatar>
                </div>

            </PopoverTrigger>
            <PopoverContent className="!p-2" side="right">
                <ScrollArea className="!max-h-[300px] mb-4">
                    <Comments comments={[{
                        content: "This is a comment",
                        createdAt: "Today",
                    }, {
                        content: "This is a comment",
                        createdAt: "Today",
                    }, {
                        content: "This is a comment",
                        createdAt: "Today",
                    }, {
                        content: "This is a comment",
                        createdAt: "Today",
                    }]} />
                </ScrollArea>
                <NewComment avatarURL={avatarURL} author={author} />
            </PopoverContent>
        </Popover>
    )
}