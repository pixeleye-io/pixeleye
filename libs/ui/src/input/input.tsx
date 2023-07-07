import { cx } from "class-variance-authority"
import * as React from "react"
import Label from "../label"
import { useId } from "react"

export interface InputBaseProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

export const InputBase = React.forwardRef<HTMLInputElement, InputBaseProps>(
    function InputBase({ className, type, ...props }, ref) {
        return (
            <input
                type={type}
                className={cx(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    function Input({ label, id: passedId, ...rest }) {

        const randId = useId()
        const id = passedId ?? randId;

        return (
            <div className="grid w-full max-w-sm items-center gap-2">
                <Label htmlFor={id}>{label}</Label>
                <InputBase id={id} {...rest} />
            </div>
        )
    }
)

export default Input;