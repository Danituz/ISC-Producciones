import type { Channel } from "@/lib/types";

export function ChannelList({ channels }: { channels: Channel[] }) {
  if (!channels?.length) return null;
  return (
    <div className="rounded-xl border border-border/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/50">
        {channels
          .sort((a, b) => a.number - b.number)
          .map((c) => (
            <div key={c.number} className="bg-zinc-950/50 p-3">
              <div className="text-xs text-zinc-400">Canal {c.number}</div>
              <div className="text-sm font-medium">{c.label}</div>
              <div className="mt-1 text-xs text-zinc-500 space-x-3">
                {c.mic_color && <span>Mic: {c.mic_color}</span>}
                {c.group_bus && <span>Grupo: {c.group_bus}</span>}
                {c.mix_bus && <span>Mix: {c.mix_bus}</span>}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
