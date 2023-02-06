"use client";

import { XMarkIcon } from "@heroicons/react/24/solid";
import { Container } from "@pixeleye/ui";
import * as Dialog from "@radix-ui/react-dialog";

interface ImportCardProps {
  name: string;
  disabled?: boolean;
}
function ImportCard({ name, disabled }: ImportCardProps) {
  return (
    <div className="relative">
      <div className="w-56 h-56 mx-auto bg-neutral-900">{name}</div>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button disabled={disabled}>
            <span className="absolute inset-0" />
            <span className="sr-only">Open {name}</span>
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/25 backdrop-blur-sm " />
          <Dialog.Content className="fixed p-4 -translate-x-1/2 -translate-y-1/2 bg-white border rounded-md dark:bg-black top-1/2 left-1/2 border-neutral-300 dark:border-neutral-700">
            <Dialog.Title className="DialogTitle">Edit profile</Dialog.Title>
            <Dialog.Description className="DialogDescription">
              Make changes to your profile here. Click save when you're done.
            </Dialog.Description>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="name">
                Name
              </label>
              <input className="Input" id="name" defaultValue="Pedro Duarte" />
            </fieldset>
            <fieldset className="Fieldset">
              <label className="Label" htmlFor="username">
                Username
              </label>
              <input className="Input" id="username" defaultValue="@peduarte" />
            </fieldset>
            <div
              style={{
                display: "flex",
                marginTop: 25,
                justifyContent: "flex-end",
              }}
            >
              <Dialog.Close asChild>
                <button className="Button green">Save changes</button>
              </Dialog.Close>
            </div>
            <Dialog.Close asChild>
              <button className="IconButton" aria-label="Close">
                <XMarkIcon />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export default function AddPage() {
  return (
    <>
      <Container className="py-12">
        <h1 className="text-4xl">Add project</h1>
        <p>setup a new project by selecting an option below</p>
      </Container>
      <Container className="flex flex-wrap items-center justify-center gap-8">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <ImportCard name="Github" />
          <ImportCard disabled name="Gitlab" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <ImportCard disabled name="Bitbucket" />
          <ImportCard disabled name="Other" />
        </div>
      </Container>
    </>
  );
}
