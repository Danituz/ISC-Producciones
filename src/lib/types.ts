export type Assignment = { name: string; role: "audio" | "luces" };

export type Channel = {
  number: number;
  label: string;
  mic_color?: string;
  group_bus?: string;
  mix_bus?: string;
};

export type EventItem = {
  id: string;
  dateLabel: string;            // "Dom 29 Sep, 12:00–14:00"
  church_or_event: string;
  pastor_name: string;
  arrival: string;              // "10:45 AM"
  time: string;                 // "12:00 PM – 2:00 PM"
  scene_audio?: string;
  scene_lights?: string;
  channel_preset_name?: string;
  assignments: Assignment[];
  channels: Channel[];
  croquis_image_url?: string;
  notes?: string;
};
