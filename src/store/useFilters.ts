import { create } from "zustand";

type FiltersState = {
  weekTab: "this" | "next";
  setWeekTab: (v: "this" | "next") => void;
};

export const useFilters = create<FiltersState>((set) => ({
  weekTab: "this",
  setWeekTab: (v) => set({ weekTab: v }),
}));
