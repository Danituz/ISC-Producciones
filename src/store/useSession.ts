import { create } from "zustand";

type Session = { isAdmin: boolean; name?: string } | null;

type SessionState = {
  session: Session;
  loginAsAdmin: () => void;
  logout: () => void;
};

export const useSession = create<SessionState>((set) => ({
  session: null,
  loginAsAdmin: () => set({ session: { isAdmin: true, name: "Admin" } }),
  logout: () => set({ session: null }),
}));
