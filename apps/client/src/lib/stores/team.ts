import { create } from "zustand";

interface TeamState {
  teamId: string;
  setTeamId: (teamId: string) => void;
}

export const useTeamStore = create<TeamState>()((set) => ({
  teamId: "",
  setTeamId: (teamId: string) => set({ teamId }),
}));
