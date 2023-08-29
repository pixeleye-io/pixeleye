"use client";
import { Repo } from "@pixeleye/api";
import { ColumnDef } from "@tanstack/react-table";

export const columns: ColumnDef<Repo>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <div className="">
          <h3 className="text-sm font-semibold leading-6">
            {row.getValue("name")}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 leading-5">
            {row.original.description}
          </p>
        </div>
      );
    },
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
  },
  {
    accessorKey: "lastUpdated",
    header: "Last Updated",
  },
];
