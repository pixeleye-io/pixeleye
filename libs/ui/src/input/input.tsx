import { cx } from "class-variance-authority";
import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import { Label } from "../label";
import { useId } from "react";

export interface InputBaseProps extends InputHTMLAttributes<HTMLInputElement> { }

export const InputBase = forwardRef<HTMLInputElement, InputBaseProps>(
  function InputBase({ className, type, ...props }, ref) {
    return (
      <input
        type={type}
        className={cx(
          "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-on-surface-variant focus-visible:outline-none ring-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, suffix, id: passedId, ...rest },
  ref
) {
  const randId = useId();
  const id = passedId ?? randId;

  return (
    <div className="grid items-center w-full max-w-sm gap-2 text-on-surface">
      <Label className="text-start" htmlFor={id}>{label}</Label>
      <div className="flex justify-center items-center space-x-2">
        <InputBase id={id} {...rest} ref={ref} />
        {suffix && <span className="whitespace-nowrap">{suffix}</span>}
      </div>

    </div>
  );
});

export default Input;
