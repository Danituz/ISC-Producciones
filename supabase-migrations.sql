-- =============================================================================
-- MIGRACIONES SUPABASE - ISCProductions Reestructuración
-- =============================================================================
-- Ejecutar en orden en el SQL Editor de Supabase
-- =============================================================================

-- =============================================================================
-- 1. CREAR TABLA: organizations
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Datos básicos
  name TEXT NOT NULL,
  pastor_name TEXT,

  -- Horarios por defecto (TIME en formato HH:MM:SS)
  default_arrival_time TIME,
  default_start_time TIME,
  default_end_time TIME,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(user_id, name);

-- RLS (Row Level Security)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their organizations" ON organizations;
CREATE POLICY "Users can manage their organizations"
  ON organizations FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 2. CREAR TABLA: settings (configuración del admin)
-- =============================================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  payroll_rate INTEGER DEFAULT 800,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their settings" ON settings;
CREATE POLICY "Users can manage their settings"
  ON settings FOR ALL
  USING (auth.uid() = user_id);

-- =============================================================================
-- 3. MODIFICAR TABLA: events (agregar organization_id y period)
-- =============================================================================
-- Agregar columna organization_id
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Índices para filtrar por organización y período
CREATE INDEX IF NOT EXISTS idx_events_organization_id ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(user_id, date);

-- =============================================================================
-- 4. MODIFICAR TABLAS DE RECURSOS (agregar FK a organization)
-- =============================================================================

-- scenes_audio
ALTER TABLE scenes_audio
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_scenes_audio_org ON scenes_audio(organization_id);

-- scenes_lights
ALTER TABLE scenes_lights
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_scenes_lights_org ON scenes_lights(organization_id);

-- croquis
ALTER TABLE croquis
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_croquis_org ON croquis(organization_id);

-- channel_presets
ALTER TABLE channel_presets
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_channel_presets_org ON channel_presets(organization_id);

-- =============================================================================
-- 5. ASEGURAR CAMPOS AVATAR EN members
-- =============================================================================
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS avatar_seed TEXT,
  ADD COLUMN IF NOT EXISTS avatar_style TEXT DEFAULT 'dylan',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- =============================================================================
-- 6. AGREGAR FK DE RECURSOS A organizations
-- =============================================================================
-- Estos campos permiten que la organización tenga recursos por defecto
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS scene_audio_id UUID REFERENCES scenes_audio(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scene_lights_id UUID REFERENCES scenes_lights(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS croquis_id UUID REFERENCES croquis(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel_preset_id UUID REFERENCES channel_presets(id) ON DELETE SET NULL;

-- =============================================================================
-- 7. FUNCIÓN PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =============================================================================v

-- =============================================================================
-- 8. MIGRACIÓN DE DATOS EXISTENTES (ejecutar después de crear tablas)
-- =============================================================================
-- NOTA: Ejecutar este bloque SOLO si ya tienes datos en events

-- 8.1 Crear organizations desde eventos existentes (nombres únicos)
-- INSERT INTO organizations (user_id, name, pastor_name)
-- SELECT DISTINCT user_id, church_or_event, pastor_name
-- FROM events
-- WHERE church_or_event IS NOT NULL AND church_or_event != ''
-- ON CONFLICT DO NOTHING;

-- 8.2 Vincular eventos existentes a sus organizaciones
-- UPDATE events e
-- SET organization_id = o.id
-- FROM organizations o
-- WHERE e.user_id = o.user_id
--   AND e.church_or_event = o.name
--   AND (e.pastor_name IS NOT DISTINCT FROM o.pastor_name);

-- 8.3 Crear settings por defecto para usuarios existentes
-- INSERT INTO settings (user_id, payroll_rate)
-- SELECT DISTINCT user_id, 800
-- FROM events
-- ON CONFLICT (user_id) DO NOTHING;

-- =============================================================================
-- VERIFICACIÓN: Ejecutar para confirmar que todo está creado
-- =============================================================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('organizations', 'settings');

-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'events' AND column_name = 'organization_id';

-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'organizations';
