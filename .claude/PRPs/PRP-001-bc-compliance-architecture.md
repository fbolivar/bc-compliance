# PRP-001: BC Compliance - Arquitectura GRC + SecOps

## Meta
- **Autor**: BC Security Team
- **Estado**: Aprobado
- **Fecha**: 2026-03-19
- **Prioridad**: Crítica

## 1. Visión del Producto

BC Compliance es una plataforma unificada de ciberseguridad técnica y cumplimiento normativo (GRC + SecOps Fusion). Conecta el SGSI con la infraestructura tecnológica en tiempo real.

**Propuesta de Valor**: Trazabilidad completa Activo → Riesgo → Amenaza → Vulnerabilidad → Control → Cumplimiento.

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Base de Datos | Supabase (PostgreSQL 15+) |
| Estilos | Tailwind CSS 3.4 |
| Estado | Zustand |
| Validación | Zod |
| Auth | Supabase Auth + MFA |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Reporting | PDF/Excel generation |

## 3. Arquitectura de Base de Datos

### 3.1 Modelo Multi-Tenant
- Aislamiento por `organization_id` en TODAS las tablas
- RLS policies en PostgreSQL para enforcement a nivel DB
- Función `get_user_org_ids()` como base de todas las policies

### 3.2 Tablas Core (45+ tablas)

#### Plataforma
- organizations, profiles, organization_members, roles, permissions, role_permissions

#### Gestión de Activos (CMDB)
- asset_categories, assets, asset_dependencies

#### MAGERIT 3.0
- threat_catalog, risk_scenarios, risk_vulnerabilities
- treatment_plans, treatment_plan_risks, treatment_plan_actions

#### Vulnerabilidades
- vulnerabilities, asset_vulnerabilities

#### Controles y Cumplimiento
- frameworks, framework_domains, framework_requirements
- requirement_mappings (cross-framework mapping engine)
- controls, control_requirement_mappings, control_risk_mappings
- soa_entries

#### SecOps
- incidents, incident_assets, incident_timeline, incident_risks

#### Calidad
- nonconformities, capa_actions

#### Proveedores
- vendors, vendor_assessments

#### Documentos y Evidencias
- documents, document_versions, evidence

#### Auditoría
- audit_programs, audit_findings

#### Automatización
- automation_rules, automation_executions

#### Integraciones
- integration_connectors, integration_events

#### Sistema
- audit_logs (inmutable), notifications, dashboard_metrics

### 3.3 MAGERIT 3.0 - Motor de Riesgos

Cálculo dinámico:
1. **Valoración**: Activo valorado en 5 dimensiones (C, I, D, A, T) escala 0-10
2. **Degradación**: % de degradación por amenaza por dimensión
3. **Impacto**: valor_activo × (degradación / 100)
4. **Frecuencia**: Escala MAGERIT 0-5
5. **Riesgo Potencial**: impacto_max × frecuencia
6. **Salvaguardas**: Efectividad agregada de controles (max 95%)
7. **Riesgo Residual**: riesgo_potencial × (1 - efectividad/100)

Triggers automáticos recalculan cuando cambian valores de activos, degradaciones o controles.

### 3.4 Control Mapping Engine

- `frameworks` → `framework_domains` → `framework_requirements` (jerarquía)
- `requirement_mappings` mapea equivalencias entre frameworks (N:N)
- `controls` (org) → `control_requirement_mappings` → satisface requisitos
- Un control puede cubrir múltiples requisitos de múltiples frameworks
- Evita duplicidad: implementar un control cubre todos los frameworks mapeados

## 4. Módulos Funcionales

### Fase 1 - Core (MVP)
1. Auth + Multi-tenant + RBAC
2. Gestión de Activos (CMDB)
3. Gestión de Riesgos (MAGERIT 3.0)
4. Catálogo de Amenazas
5. Gestión de Controles
6. Cumplimiento Multi-Framework
7. Dashboard GRC

### Fase 2 - SecOps
8. Gestión de Vulnerabilidades
9. Gestión de Incidentes
10. Motor de Automatización (SOAR-lite)
11. Integraciones (SIEM/Scanner/EDR)

### Fase 3 - Governance
12. No Conformidades + CAPA
13. Gestión de Proveedores
14. Gestión Documental + Evidencias
15. Auditorías + Reporting

### Fase 4 - Enterprise
16. Generación automática de informes certificadora
17. API pública
18. Multi-idioma
19. Marketplace de integraciones

## 5. Seguridad por Diseño

- **RBAC + ABAC**: Roles con permisos granulares por módulo/acción + condiciones
- **RLS**: Aislamiento multi-tenant a nivel PostgreSQL
- **Audit Trail**: Tabla inmutable con trigger que previene UPDATE/DELETE
- **Cifrado**: TLS en tránsito, AES-256 en reposo (Supabase)
- **MFA**: Soporte para autenticación multifactor
- **Zero Trust**: Verificación de sesión en cada request server-side
- **OWASP Top 10**: Validación Zod, CSP headers, sanitización

## 6. Frameworks Soportados (13)

### Internacionales
- ISO/IEC 27001:2022
- ISO/IEC 27002:2022
- ISO/IEC 27701:2019
- ISO/IEC 27032:2023
- ISO 22301:2019
- NIST CSF 2.0
- PCI DSS 4.0

### Regionales
- NIS2 Directive
- GDPR

### Colombia
- Ley 1581 de 2012 (Protección Datos)
- Ley 1273 de 2009 (Delitos Informáticos)
- Decreto 1078 de 2015 (TIC)
- Decreto 338 de 2022 (Seguridad Digital)

## 7. Integraciones Planificadas

| Tipo | Productos |
|------|-----------|
| SIEM | Wazuh, Splunk, ELK/OpenSearch |
| Escáneres | OpenVAS/Greenbone, Nessus/Tenable |
| EDR/XDR | CrowdStrike, SentinelOne, Microsoft Defender |
| Directorio | Active Directory, Azure AD, LDAP |
| Ticketing | Jira, ServiceNow |

## 8. Reporting

Generación automática de informes para:
- AENOR, SGS, Bureau Veritas, ICONTEC
- Formato: PDF y Excel
- Evidencias trazables vinculadas a controles

## 9. Estructura del Proyecto

```
src/
├── app/(auth)/          # Login, Signup, MFA
├── app/(platform)/      # 35+ rutas protegidas
├── features/            # 17 módulos feature-first
├── shared/              # Componentes, hooks, utils compartidos
│   ├── constants/       # MAGERIT catalog, frameworks
│   └── utils/           # risk-calculator, compliance-calculator
└── types/               # database.ts (2500+ lines)

supabase/
├── migrations/          # 4 archivos de migración
│   ├── 00001_*.sql     # Enums + Core Platform + CMDB
│   ├── 00002_*.sql     # MAGERIT Risk + Controls + Compliance
│   ├── 00003_*.sql     # SecOps + Vendors + Docs + Audits + Automation
│   └── 00004_*.sql     # Functions + Triggers + RLS + Seed Data
```

## 10. Dashboard KPIs

- % Cumplimiento por framework
- Riesgo residual promedio
- Nivel de madurez
- Vulnerabilidades críticas abiertas
- Incidentes activos
- Controles implementados vs pendientes
- Próximas auditorías
- No conformidades abiertas
