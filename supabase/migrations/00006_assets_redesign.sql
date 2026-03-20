-- =============================================================
-- BC TRUST - MIGRATION 006: ASSETS MODULE REDESIGN
-- Colombian Government Asset Inventory (Parques Nacionales)
-- ISO 27001 + Ley 1712/2014 + Ley 1581/2012 + MAGERIT v3
-- =============================================================

-- =============================================================
-- STEP 1: NEW ENUMS
-- Use DO blocks for idempotency (safe to re-run)
-- =============================================================

-- Process type: clasificación de procesos según el modelo MIPG
DO $$ BEGIN
  CREATE TYPE process_type AS ENUM (
    'estrategico',
    'misional',
    'apoyo',
    'seguimiento_control'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Support type: soporte físico o digital del activo de información
DO $$ BEGIN
  CREATE TYPE support_type AS ENUM (
    'fisico',
    'electronico',
    'digital',
    'fisico_electronico',
    'fisico_digital',
    'electronico_digital',
    'fisico_electronico_digital',
    'na'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Language of the asset content
DO $$ BEGIN
  CREATE TYPE asset_language AS ENUM (
    'espanol',
    'ingles',
    'otro'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CIA level qualitative label (Alto / Medio / Bajo)
DO $$ BEGIN
  CREATE TYPE cia_level AS ENUM (
    'alto',
    'medio',
    'bajo'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Update/review frequency of the asset
DO $$ BEGIN
  CREATE TYPE update_frequency AS ENUM (
    'diaria',
    'semanal',
    'quincenal',
    'mensual',
    'trimestral',
    'semestral',
    'anual',
    'segun_requerimiento'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Personal data classification per Ley 1581 de 2012
DO $$ BEGIN
  CREATE TYPE personal_data_type AS ENUM (
    'publico',
    'privado',
    'semiprivado',
    'sensible',
    'na'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================
-- STEP 2: ADD NEW COLUMNS TO assets TABLE
-- All via ADD COLUMN IF NOT EXISTS for full idempotency
-- =============================================================

-- -------------------------------------------------------------
-- SECTION A: Identification Parameters
-- Campos de identificación documental / informacional
-- -------------------------------------------------------------

-- Tipo de proceso al que pertenece el activo (MIPG)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS process_type process_type;

-- Nombre descriptivo del proceso dueño del activo
ALTER TABLE assets ADD COLUMN IF NOT EXISTS process_name TEXT;

-- Sede o área física donde reside o aplica el activo
ALTER TABLE assets ADD COLUMN IF NOT EXISTS sede TEXT;

-- Código identificador personalizado del activo (ej: código interno Parques)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_id_custom TEXT;

-- Referencia a la Tabla de Retención Documental (TRD) - serie documental
ALTER TABLE assets ADD COLUMN IF NOT EXISTS trd_serie TEXT;

-- Fecha en que fue generada la información contenida en el activo
ALTER TABLE assets ADD COLUMN IF NOT EXISTS info_generation_date DATE;

-- Fecha de ingreso del activo al inventario
ALTER TABLE assets ADD COLUMN IF NOT EXISTS entry_date DATE;

-- Fecha de salida o baja del activo del inventario
ALTER TABLE assets ADD COLUMN IF NOT EXISTS exit_date DATE;

-- Idioma principal del contenido del activo
ALTER TABLE assets ADD COLUMN IF NOT EXISTS language asset_language DEFAULT 'espanol';

-- Formato del activo (ej: PDF, Excel, base de datos, hardware)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS format TEXT;

-- -------------------------------------------------------------
-- SECTION B: Location & Support
-- Dónde y en qué soporte reside el activo
-- -------------------------------------------------------------

-- Tipo de soporte: físico, electrónico, digital o combinación
ALTER TABLE assets ADD COLUMN IF NOT EXISTS support support_type DEFAULT 'na';

-- Lugar físico o digital donde se puede consultar el activo
ALTER TABLE assets ADD COLUMN IF NOT EXISTS consultation_place TEXT;

-- -------------------------------------------------------------
-- SECTION C: Ownership & Stewardship
-- Propietario y custodia de la información
-- -------------------------------------------------------------

-- Propietario de la información (nombre del cargo o área)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS info_owner TEXT;

-- Custodio responsable de la guarda y administración del activo
ALTER TABLE assets ADD COLUMN IF NOT EXISTS info_custodian TEXT;

-- Frecuencia con la que se actualiza o revisa el activo
ALTER TABLE assets ADD COLUMN IF NOT EXISTS update_frequency update_frequency;

-- -------------------------------------------------------------
-- SECTION D: Critical Cyber Infrastructure (ICC)
-- Infraestructura Crítica Cibernética según CONPES 3995
-- -------------------------------------------------------------

-- El activo genera impacto social si es comprometido
ALTER TABLE assets ADD COLUMN IF NOT EXISTS icc_social_impact BOOLEAN DEFAULT false;

-- El activo genera impacto económico si es comprometido
ALTER TABLE assets ADD COLUMN IF NOT EXISTS icc_economic_impact BOOLEAN DEFAULT false;

-- El activo genera impacto ambiental si es comprometido
ALTER TABLE assets ADD COLUMN IF NOT EXISTS icc_environmental_impact BOOLEAN DEFAULT false;

-- Bandera resultante: el activo es Infraestructura Crítica Cibernética
ALTER TABLE assets ADD COLUMN IF NOT EXISTS icc_is_critical BOOLEAN DEFAULT false;

-- -------------------------------------------------------------
-- SECTION E: Security Classification (CIA Triad)
-- Valoración cualitativa y cuantitativa MAGERIT v3
-- Scale: 1 (Muy Bajo) → 5 (Muy Alto)
-- NOTE: val_confidentiality / val_integrity / val_availability
--       already exist on scale 0-10 (legacy MAGERIT raw values).
--       These new columns use the 1-5 governance scoring scale
--       aligned with the Parques Nacionales risk methodology.
-- -------------------------------------------------------------

-- Nivel cualitativo de confidencialidad (alto/medio/bajo)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS confidentiality cia_level;

-- Nivel cualitativo de integridad (alto/medio/bajo)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS integrity cia_level;

-- Nivel cualitativo de disponibilidad (alto/medio/bajo)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS availability cia_level;

-- Valor numérico de confidencialidad en escala 1-5
ALTER TABLE assets ADD COLUMN IF NOT EXISTS confidentiality_value SMALLINT DEFAULT 1
  CHECK (confidentiality_value BETWEEN 1 AND 5);

-- Valor numérico de integridad en escala 1-5
ALTER TABLE assets ADD COLUMN IF NOT EXISTS integrity_value SMALLINT DEFAULT 1
  CHECK (integrity_value BETWEEN 1 AND 5);

-- Valor numérico de disponibilidad en escala 1-5
ALTER TABLE assets ADD COLUMN IF NOT EXISTS availability_value SMALLINT DEFAULT 1
  CHECK (availability_value BETWEEN 1 AND 5);

-- Valor total promediado CIA (columna generada, siempre calculada)
-- Stored so it can be indexed and queried without re-computing
ALTER TABLE assets ADD COLUMN IF NOT EXISTS total_value NUMERIC(3,1)
  GENERATED ALWAYS AS (
    (confidentiality_value + integrity_value + availability_value) / 3.0
  ) STORED;

-- Criticidad resultante del análisis CIA (columna generada)
--   >= 4.0  → Alto
--   >= 2.5  → Medio
--   <  2.5  → Bajo
ALTER TABLE assets ADD COLUMN IF NOT EXISTS criticality_cid TEXT
  GENERATED ALWAYS AS (
    CASE
      WHEN (confidentiality_value + integrity_value + availability_value) / 3.0 >= 4.0
        THEN 'Alto'
      WHEN (confidentiality_value + integrity_value + availability_value) / 3.0 >= 2.5
        THEN 'Medio'
      ELSE 'Bajo'
    END
  ) STORED;

-- -------------------------------------------------------------
-- SECTION F: Classified and Reserved Information Index
-- Índice de Información Clasificada y Reservada
-- Base legal: Ley 1712 de 2014 (Transparencia y acceso a la info pública)
-- -------------------------------------------------------------

-- Objetivo de excepción: "Publica", "Clasificada", "Reservada"
ALTER TABLE assets ADD COLUMN IF NOT EXISTS exception_objective TEXT;

-- Fundamento constitucional que ampara la excepción (art. de la Constitución)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS constitutional_basis TEXT;

-- Norma legal que fundamenta la excepción de divulgación
ALTER TABLE assets ADD COLUMN IF NOT EXISTS legal_exception_basis TEXT;

-- Alcance de la restricción: "Total", "Parcial", "N/A"
ALTER TABLE assets ADD COLUMN IF NOT EXISTS exception_scope TEXT;

-- Fecha en que se realizó la clasificación o reserva
ALTER TABLE assets ADD COLUMN IF NOT EXISTS classification_date DATE;

-- Término de la clasificación: "Ilimitada", "Reservada", "Publica"
ALTER TABLE assets ADD COLUMN IF NOT EXISTS classification_term TEXT;

-- -------------------------------------------------------------
-- SECTION G: Personal Data Inventory
-- Registro de datos personales
-- Base legal: Ley 1581 de 2012 + Decreto 1377 de 2013
-- -------------------------------------------------------------

-- El activo contiene datos personales de titulares
ALTER TABLE assets ADD COLUMN IF NOT EXISTS contains_personal_data BOOLEAN DEFAULT false;

-- El activo contiene datos de menores de edad (requiere tratamiento especial)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS contains_minors_data BOOLEAN DEFAULT false;

-- Clasificación del tipo de dato personal (público, privado, semiprivado, sensible)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS personal_data_type personal_data_type DEFAULT 'na';

-- Finalidad del tratamiento de los datos personales contenidos
ALTER TABLE assets ADD COLUMN IF NOT EXISTS personal_data_purpose TEXT;

-- Indica si existe autorización expresa del titular para el tratamiento
ALTER TABLE assets ADD COLUMN IF NOT EXISTS has_data_authorization BOOLEAN;

-- =============================================================
-- STEP 3: INDEXES FOR NEW COLUMNS
-- Only on columns likely to be used in WHERE / ORDER BY / JOIN
-- =============================================================

-- Filtrar por tipo de proceso (muy frecuente en vistas de inventario)
CREATE INDEX IF NOT EXISTS idx_assets_process_type
  ON assets(organization_id, process_type);

-- Filtrar por sede (Parques Nacionales tiene múltiples sedes regionales)
CREATE INDEX IF NOT EXISTS idx_assets_sede
  ON assets(organization_id, sede);

-- Filtrar activos de Infraestructura Crítica Cibernética
CREATE INDEX IF NOT EXISTS idx_assets_icc_critical
  ON assets(organization_id, icc_is_critical)
  WHERE icc_is_critical = true;

-- Filtrar por criticidad CIA calculada (Alto/Medio/Bajo)
CREATE INDEX IF NOT EXISTS idx_assets_criticality_cid
  ON assets(organization_id, criticality_cid);

-- Filtrar activos con datos personales (auditorías de privacidad)
CREATE INDEX IF NOT EXISTS idx_assets_personal_data
  ON assets(organization_id, contains_personal_data)
  WHERE contains_personal_data = true;

-- Filtrar por tipo de soporte (inventarios físicos vs digitales)
CREATE INDEX IF NOT EXISTS idx_assets_support
  ON assets(organization_id, support);

-- Filtrar por fecha de salida (activos dados de baja)
CREATE INDEX IF NOT EXISTS idx_assets_exit_date
  ON assets(organization_id, exit_date)
  WHERE exit_date IS NOT NULL;

-- =============================================================
-- STEP 4: COMMENT THE TABLE AND KEY COLUMNS
-- Self-documenting schema for future maintainers
-- =============================================================

COMMENT ON TABLE assets IS
  'Inventario de Activos de Información - BC Trust GRC.
   Parques Nacionales Naturales de Colombia.
   Metodología: MAGERIT v3 + ISO 27001:2022 + Ley 1712/2014 + Ley 1581/2012.';

COMMENT ON COLUMN assets.process_type IS
  'Tipo de proceso al que pertenece el activo según modelo MIPG: estratégico, misional, apoyo o seguimiento y control.';
COMMENT ON COLUMN assets.trd_serie IS
  'Referencia a la Tabla de Retención Documental (TRD): serie y subserie documental.';
COMMENT ON COLUMN assets.icc_is_critical IS
  'TRUE si el activo forma parte de la Infraestructura Crítica Cibernética (ICC) según CONPES 3995 de 2020.';
COMMENT ON COLUMN assets.confidentiality_value IS
  'Valor numérico de confidencialidad en escala 1 (Muy Bajo) a 5 (Muy Alto). Escala de gobierno Parques Nacionales.';
COMMENT ON COLUMN assets.integrity_value IS
  'Valor numérico de integridad en escala 1 (Muy Bajo) a 5 (Muy Alto). Escala de gobierno Parques Nacionales.';
COMMENT ON COLUMN assets.availability_value IS
  'Valor numérico de disponibilidad en escala 1 (Muy Bajo) a 5 (Muy Alto). Escala de gobierno Parques Nacionales.';
COMMENT ON COLUMN assets.total_value IS
  'Promedio CIA calculado automáticamente: (confidentiality_value + integrity_value + availability_value) / 3.';
COMMENT ON COLUMN assets.criticality_cid IS
  'Nivel de criticidad calculado: Alto (>=4), Medio (>=2.5), Bajo (<2.5). Columna generada, no editable.';
COMMENT ON COLUMN assets.exception_objective IS
  'Clasificación Ley 1712/2014: "Publica", "Clasificada" o "Reservada".';
COMMENT ON COLUMN assets.contains_personal_data IS
  'TRUE si el activo contiene datos personales sujetos a Ley 1581 de 2012.';
COMMENT ON COLUMN assets.personal_data_type IS
  'Clasificación del dato personal: público, privado, semiprivado o sensible (Ley 1581/2012).';
COMMENT ON COLUMN assets.has_data_authorization IS
  'TRUE si existe autorización del titular para el tratamiento de datos personales.';
