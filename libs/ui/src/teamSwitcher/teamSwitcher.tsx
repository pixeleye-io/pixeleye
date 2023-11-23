"use client";

import { useState, ComponentPropsWithoutRef } from "react";

import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/outline";

import { Avatar } from "../avatar";
import { Button } from "../button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { cx } from "class-variance-authority";
import { Team, User } from "@pixeleye/api";

type PopoverTriggerProps = ComponentPropsWithoutRef<typeof PopoverTrigger>;

export interface TeamSwitcherProps extends PopoverTriggerProps {
  personal: Team;
  teams: Team[];
  user?: User;
  selectedTeam: Team;
  setSelectedTeam: (team: Team) => void;
  teamsHeading?: React.ReactNode;
}

export default function TeamSwitcher({
  className,
  personal,
  teams,
  user,
  selectedTeam,
  setSelectedTeam,
  teamsHeading,
}: TeamSwitcherProps) {
  const [open, setOpen] = useState(false);

  const groups = [
    {
      label: "Personal",
      teams: [personal],
    },
    {
      label: "Teams",
      teams: teams,
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a team"
          className={cx("max-w-[12rem] overflow-hidden", className)}
          innerClassName={"justify-between overflow-hidden"}
          outerClassName="flex-1 overflow-hidden"
        >
          <Avatar className="mr-4 h-6 w-6">
            <Avatar.Image
              src={(selectedTeam.type === "user" ? user?.avatar : selectedTeam.avatarURL) || ""}
              alt={selectedTeam.name}
            />
            <Avatar.Fallback>{selectedTeam.name.charAt(0)}</Avatar.Fallback>
          </Avatar>
          <span className="truncate min-w-0 max-w-full">
            {selectedTeam.name}
          </span>
          <ChevronUpDownIcon className="ml-4 h-4 w-4 shrink-0 text-on-surface-variant" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] !p-0">
        <Command>
          <CommandList>
            {groups.map((group) => (
              <CommandGroup
                key={group.label}
                heading={
                  group.label === "Teams"
                    ? teamsHeading ?? "Teams"
                    : group.label
                }
              >
                {group.teams.map((team) => (
                  <CommandItem
                    key={team.id}
                    onSelect={() => {
                      setSelectedTeam(team);
                      setOpen(false);
                    }}
                    className="text-sm"
                  >
                    <Avatar className="mr-2 h-5 w-5">
                      <Avatar.Image
                        src={(team.type === "user" ? user?.avatar : team.avatarURL) || ""}
                        alt={team.name}
                      />
                      <Avatar.Fallback>{team.name.charAt(0)}</Avatar.Fallback>
                    </Avatar>
                    <span className="truncate pr-2">{team.name}</span>
                    <CheckIcon
                      className={cx(
                        "ml-auto h-4 w-4",
                        selectedTeam.id === team.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
