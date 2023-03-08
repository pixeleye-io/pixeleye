"use client";

import { FC, Fragment } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Spinner from "../spinner/spinner";

export interface ModalFooterProps {
  children: React.ReactNode;
}

const Footer: FC<ModalFooterProps> = ({ children }) => {
  return (
    <div className="flex justify-end -mx-4 -mb-4 divide-x">{children}</div>
  );
};

export interface ModalButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  close?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

export const Button: FC<ModalButtonProps> = ({
  children,
  onClick,
  close,
  loading,
  disabled,
}) => {
  const Component = close ? Dialog.Close : Fragment;
  return (
    <Component {...(close && { asChild: true })}>
      <button
        disabled={disabled || loading}
        onClick={onClick}
        className="flex items-center justify-center w-full h-12 px-4 text-center border-t border-gray-300 shrink dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        {children}
        <Spinner className="ml-1" loading={loading} />
      </button>
    </Component>
  );
};

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  title: string;
  description?: string;
  disableOutsideClick?: boolean;
}

const Modal: FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  disableOutsideClick,
  children,
}) => {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={() => {
        onOpenChange?.(!open);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm" />
        <Dialog.Content
          onInteractOutside={(e) => {
            if (disableOutsideClick) e.preventDefault();
          }}
          className="fixed z-50 p-4 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-md dark:bg-gray-900 top-1/2 left-1/2 dark:border-gray-800"
        >
          <div className="mb-2 border-b border-gray-300 dark:border-gray-700">
            <Dialog.Title className="text-2xl">{title}</Dialog.Title>
            {description && (
              <Dialog.Description className="mt-3 mb-5 text-sm text-gray-600 dark:text-gray-400">
                {description}
              </Dialog.Description>
            )}
          </div>

          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Object.assign(Modal, { Footer, Button });
