import { FC, Fragment } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export interface ModalFooterProps {
  children: React.ReactNode;
}

const Footer: FC<ModalFooterProps> = ({ children }) => {
  return <div className="flex justify-end space-x-2">{children}</div>;
};

export interface ModalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  close?: boolean;
}

export const Button: FC<ModalButtonProps> = ({ children, onClick, close }) => {
  const Component = close ? Dialog.Close : Fragment;
  return (
    <Component {...(close && { asChild: true })}>
      <button
        onClick={onClick}
        className="flex items-center justify-center flex-grow h-12 px-4 -mx-4 text-center border-t border-neutral-300 dark:border-neutral-700"
      >
        {children}
      </button>
    </Component>
  );
};

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  title: string;
  description: string;
}

const Modal: FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
}) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger />
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        <Dialog.Content className="fixed p-4 -translate-x-1/2 -translate-y-1/2 bg-white border rounded-md dark:bg-black top-1/2 left-1/2 border-neutral-300 dark:border-neutral-700">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Object.assign(Modal, { Footer, Button });
