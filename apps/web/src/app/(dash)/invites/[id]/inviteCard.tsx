"use client";

import { Invite } from "@pixeleye/api";
import { Avatar, Button } from "@pixeleye/ui";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

export function InviteCard({ invite }: { invite: Invite }) {
  const names = invite.inviterName.split(" ");

  return (
    <main className="w-full h-full mt-12">
      <div className="flex flex-col items-center justify-center mx-auto rounded border border-outline-variant max-w-lg p-8">
        <h1 className="text-2xl text-on-surface font-bold mt-4 text-center">
          Join project
        </h1>

        <p className="text-on-surface-variant mt-4 text-center">
          You have been invited to join the project <b>{invite.projectName}</b>{" "}
          by{" "}
          <b>
            {invite.inviterName} ({invite.inviterEmail})
          </b>
          .
        </p>

        <div className="flex space-x-4 justify-center items-center py-12">
          <Avatar className="mr-4 h-12 w-12">
            <Avatar.Image
              src={invite.inviterAvatarURL}
              alt={`Profile picture of ${invite.inviterName}`}
            />
            <Avatar.Fallback>
              {names[0].charAt(0)}
              {names.length > 1 && names.at(-1)?.charAt(0)}
            </Avatar.Fallback>
          </Avatar>
          <ArrowRightIcon className="h-6 w-6" />
          <Avatar className="mr-4 h-12 w-12">
            <Avatar.Image
              src={invite.teamAvatarURL}
              alt={`Profile picture of team ${invite.inviterName}`}
            />
            <Avatar.Fallback>{invite.teamName.charAt(0)}</Avatar.Fallback>
          </Avatar>
        </div>
        <Button>Join</Button>
      </div>
    </main>
  );
}
