"use client";

import { create } from "zustand";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { StatusType } from "@pixeleye/ui";

interface TeamState {
  teamId: string;
  setTeamId: (teamId: string) => void;
}

export const useTeamStore = create<TeamState>()((set) => ({
  teamId: "",
  setTeamId: (teamId: string) => set({ teamId }),
}));

export interface Segment {
  name: string;
  value: string;
  status?: StatusType;
  suffix?: React.ReactNode;
}

interface BreadcrumbStore {
  segmentRepo: Record<string, Segment[]>;
  setSegment: (key: string, segment: Segment[]) => void;
  deleteSegment: (key: string) => void;
}

export const useRegisterSegment = (
  key: string,
  order: number,
  segment?: Segment | Segment[] | false
) => {
  const setSegment = useBreadcrumbStore((state) => state.setSegment);
  const deleteSegment = useBreadcrumbStore((state) => state.deleteSegment);

  useEffect(() => {
    if (!segment) return;
    setSegment(`${key}-${order}`, Array.isArray(segment) ? segment : [segment]);
    return () => deleteSegment(`${key}-${order}`);
  }, [deleteSegment, key, order, segment, setSegment]);
};

export const useBreadcrumbStore = create<BreadcrumbStore>((set) => ({
  segmentRepo: {},
  setSegment: (key, segment) =>
    set((state) => ({
      segmentRepo: {
        ...state.segmentRepo,
        [key]: segment,
      },
    })),
  deleteSegment: (key) =>
    set((state) => {
      const { [key]: _, ...segmentRepo } = state.segmentRepo;
      return { segmentRepo };
    }),
}));

interface RegisterSegmentProps {
  children?: React.ReactNode;
  reference: string;
  order: number;
  segment?: Segment[] | false | Segment;
  teamId?: string;
}
export function RegisterSegment({
  children,
  reference,
  order,
  teamId,
  segment,
}: RegisterSegmentProps) {
  useRegisterSegment(reference, order, segment);
  const searchTeamId = useSearchParams()?.get("team");
  const setTeamId = useTeamStore((state) => state.setTeamId);
  useEffect(() => {
    if (teamId) setTeamId(teamId);
  }, [setTeamId, teamId]);

  useEffect(() => {
    if (searchTeamId && !teamId) setTeamId(searchTeamId);
  }, [searchTeamId, setTeamId, teamId]);

  return <>{children}</>;
}
