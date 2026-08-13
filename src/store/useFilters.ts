import { create } from "zustand";
import type { GameCategory } from "@/data/types";

export type OptionalCategory = Extract<
  GameCategory,
  "spinoff" | "compilation" | "edition" | "broadcast" | "curiosity"
>;
export type OwnershipFilter = "all" | "owned" | "missing" | "cib" | "incomplete";

interface FiltersState {
  search: string;
  ownership: OwnershipFilter;
  categories: Record<OptionalCategory, boolean>;
  setSearch: (value: string) => void;
  setOwnership: (value: OwnershipFilter) => void;
  toggleCategory: (category: OptionalCategory) => void;
  isCategoryVisible: (category: GameCategory) => boolean;
}

export const useFilters = create<FiltersState>((set, get) => ({
  search: "",
  ownership: "all",
  categories: {
    spinoff: true,
    compilation: true,
    edition: true,
    broadcast: false,
    curiosity: false,
  },
  setSearch: (value) => set({ search: value }),
  setOwnership: (value) => set({ ownership: value }),
  toggleCategory: (category) =>
    set((state) => ({
      categories: { ...state.categories, [category]: !state.categories[category] },
    })),
  isCategoryVisible: (category) => {
    if (category === "main" || category === "upcoming") return true;
    return get().categories[category as OptionalCategory];
  },
}));
