export type Assignment = { name: string; role: "audio" | "luces" };

export type Channel = {
  number: number;
  label: string;
  mic_color?: string;
  group_bus?: string;
  mix_bus?: string;
};

export type Organization = {
  id: string;
  name: string;
  pastor_name?: string;
  default_arrival_time?: string;
  default_start_time?: string;
  default_end_time?: string;
  scene_audio_id?: string;
  scene_lights_id?: string;
  croquis_id?: string;
  channel_preset_id?: string;
  // Nombres resueltos (para UI)
  scene_audio_name?: string;
  scene_lights_name?: string;
  croquis_name?: string;
  croquis_image_url?: string;
  channel_preset_name?: string;
};

export type Settings = {
  payroll_rate: number;
};

export type EventItem = {
  id: string;
  date?: string;                // YYYY-MM-DD para ordenar/filtrar
  start_time?: string;          // HH:mm (opcional, útil para históricos)
  end_time?: string;
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
  organization_id?: string;
  organization_name?: string;
};
