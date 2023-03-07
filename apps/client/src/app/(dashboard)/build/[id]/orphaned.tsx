"use client";

import { useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { Button, LinkWrapper, Modal } from "@pixeleye/ui";
import { api } from "~/lib/api";

interface OrphanedAlertProps {
  buildId: string;
}

export function OrphanedAlert({ buildId }: OrphanedAlertProps) {
  const [baseOpen, setBaseOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);

  const { mutate: markBase } = api.build.markBase.useMutation({
    onSettled: () => {
      setBaseOpen(false);
    },
  });
  return (
    <>
      <section className="mb-12 sm:mb-28">
        <div className="p-4 border border-gray-200 rounded-md md:p-8 bg-gray-50 dark:bg-gray-850 dark:border-gray-800">
          <div className="flex">
            <div className="flex-shrink-0 mt-1">
              <InformationCircleIcon
                className="w-5 h-5 text-gray-400 dark:text-gray-200"
                aria-hidden="true"
              />
            </div>
            <div className="flex-col flex-1 ml-3 md:flex md:justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Orphaned build
              </h3>
              <div>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  This build has no associated parent build.
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  In order to review snapshots, you must first select a parent
                  build or mark this build as a base build.
                </p>
                <p className="mt-4 text-sm">
                  <LinkWrapper>
                    <a
                      href="#"
                      className="font-medium text-blue-700 dark:text-blue-500 whitespace-nowrap hover:text-blue-600"
                    >
                      More infomation
                      <span aria-hidden="true"> &rarr;</span>
                    </a>
                  </LinkWrapper>
                </p>
              </div>
              <div className="mt-8 ml-auto space-x-6">
                <Button onClick={() => setBaseOpen(true)} variant="secondary">
                  Set as base build
                </Button>
                <Button onClick={() => setSelectOpen(true)}>
                  Select parent build
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Modal
        title="Set as base build"
        description="Most of the time you want to select a parent, are you sure you want to make this as a base build?"
        open={baseOpen}
        disableOutsideClick
        onOpenChange={setBaseOpen}
      >
        <Modal.Footer>
          <Modal.Button
            onClick={() => {
              markBase({
                buildId,
              });
            }}
          >
            Set as base build
          </Modal.Button>
          <Modal.Button close>Cancel</Modal.Button>
        </Modal.Footer>
      </Modal>
      <Modal
        title="Select parent build"
        description="The parent build will be used to evaluate this builds screenshots against"
        open={selectOpen}
        disableOutsideClick
        onOpenChange={setSelectOpen}
      >
        <Modal.Footer>
          <Modal.Button>Not Implemented</Modal.Button>
          <Modal.Button close>Cancel</Modal.Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
