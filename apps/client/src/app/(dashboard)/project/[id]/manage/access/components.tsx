"use client";

import { ProjectRole } from "@pixeleye/db";
import { Select } from "@pixeleye/ui";

export function RoleSelect({ role }: { role: ProjectRole }) {
  return (
    <Select className="max-w-[10rem]" hiddenLabel label="Role" value={role}>
      <Select.Item value="owner">Owner</Select.Item>
      <Select.Item value="reviewer">Reviewer</Select.Item>
      <Select.Item value="viewer">Viewer</Select.Item>
    </Select>
  );
}
