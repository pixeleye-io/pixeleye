"use client";

import * as React from "react";

import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/24/outline";

import Avatar from "../avatar";
import Button from "../button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover";
import { cx } from "class-variance-authority";

interface Team {
  label: string;
  id: string;
  avatar?: string;
}

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverTrigger
>;

interface TeamSwitcherProps extends PopoverTriggerProps {
  personal: Team;
  teams: Team[];
}

export default function TeamSwitcher({
  className,
  personal,
  teams,
}: TeamSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState<Team>(personal);

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
          className={cx("w-[200px] overflow-hidden", className)}
          innerClassName={"justify-between overflow-hidden max-w-full"}
          outerClassName="flex-1 overflow-hidden"
        >
          <Avatar className="mr-2 h-5 w-5">
            <Avatar.Image
              src={selectedTeam.avatar || ""}
              alt={selectedTeam.label}
            />
            <Avatar.Fallback>AJ</Avatar.Fallback>
          </Avatar>
          <span className="truncate min-w-0 max-w-full">
            {selectedTeam.label}
          </span>
          <ChevronUpDownIcon className="ml-auto h-4 w-4 shrink-0 text-on-surface-variant" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] !p-0">
        <Command>
          <CommandList>
            <CommandInput placeholder="Search team..." />
            <CommandEmpty>No team found.</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
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
                        src={team.avatar || ""}
                        alt={team.label}
                        className="grayscale"
                      />
                      <Avatar.Fallback>SC</Avatar.Fallback>
                    </Avatar>
                    <span className="truncate pr-2">{team.label}</span>
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
