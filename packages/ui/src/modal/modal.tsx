"use client";

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
        className="flex items-center justify-center flex-grow h-12 px-4 -mx-4 text-center border-t border-gray-300 dark:border-gray-700"
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
        if (disableOutsideClick) return;
        onOpenChange?.(!open);
      }}
    >
      <Dialog.Trigger />
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25 backdrop-blur-sm" />
        <Dialog.Content className="fixed z-50 p-4 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-md dark:bg-gray-900 top-1/2 left-1/2 dark:border-gray-800">
          <Dialog.Title className="text-lg">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 mb-12 text-sm text-gray-700 dark:text-gray-300">
            {description}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Object.assign(Modal, { Footer, Button });
