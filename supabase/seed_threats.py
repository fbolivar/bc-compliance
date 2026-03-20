"""Insert MAGERIT threat catalog into Supabase."""
import json
import urllib.request

API = "https://api.supabase.com/v1/projects/pqboameuqyvszvsrqxiv/database/query"
TK = "sbp_fc49a4206aac45c1302630039a0ee77fa1b7ac01"


def run(desc, sql):
    data = json.dumps({"query": sql}).encode()
    req = urllib.request.Request(
        API, data=data,
        headers={"Authorization": f"Bearer {TK}", "Content-Type": "application/json", "User-Agent": "supabase-mcp/1.0"},
        method="POST",
    )
    try:
        r = urllib.request.urlopen(req, timeout=30)
        print(f"  {desc}: {r.getcode()}")
    except Exception as e:
        print(f"  {desc}: ERROR {e}")


print("=== MAGERIT Threats ===")

run("Natural", """INSERT INTO threat_catalog (organization_id, code, name, description, origin, affected_dimensions, affected_asset_types, frequency_base) VALUES
(NULL, 'N.1', 'Fuego', 'Incendio natural', 'natural', ARRAY['availability']::magerit_dimension[], ARRAY['hardware','facility']::asset_type[], 0),
(NULL, 'N.2', 'Danos por agua', 'Inundaciones', 'natural', ARRAY['availability']::magerit_dimension[], ARRAY['hardware','facility']::asset_type[], 0),
(NULL, 'N.*', 'Desastres naturales', 'Otros desastres', 'natural', ARRAY['availability']::magerit_dimension[], ARRAY['hardware','facility','network']::asset_type[], 0)""")

run("Industrial", """INSERT INTO threat_catalog (organization_id, code, name, description, origin, affected_dimensions, affected_asset_types, frequency_base) VALUES
(NULL, 'I.1', 'Fuego industrial', 'Incendio industrial', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware','facility']::asset_type[], 1),
(NULL, 'I.5', 'Averia fisica o logica', 'Fallos en equipos', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware','software']::asset_type[], 2),
(NULL, 'I.6', 'Corte electrico', 'Sin alimentacion', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['hardware','network']::asset_type[], 2),
(NULL, 'I.8', 'Fallo comunicaciones', 'Sin transmision', 'industrial', ARRAY['availability']::magerit_dimension[], ARRAY['network','service']::asset_type[], 2)""")

run("Errors", """INSERT INTO threat_catalog (organization_id, code, name, description, origin, affected_dimensions, affected_asset_types, frequency_base) VALUES
(NULL, 'E.1', 'Errores de usuarios', 'Equivocaciones', 'defects', ARRAY['integrity','availability','confidentiality']::magerit_dimension[], ARRAY['data','software']::asset_type[], 3),
(NULL, 'E.2', 'Errores del administrador', 'Config erronea', 'defects', ARRAY['integrity','availability','confidentiality']::magerit_dimension[], ARRAY['software','hardware','network']::asset_type[], 2),
(NULL, 'E.4', 'Errores de configuracion', 'Config incorrecta', 'defects', ARRAY['integrity','availability','confidentiality']::magerit_dimension[], ARRAY['software','network']::asset_type[], 2),
(NULL, 'E.20', 'Vulnerabilidades de programas', 'Bugs en codigo', 'defects', ARRAY['integrity','availability','confidentiality']::magerit_dimension[], ARRAY['software']::asset_type[], 3),
(NULL, 'E.24', 'Agotamiento de recursos', 'Sin capacidad', 'defects', ARRAY['availability']::magerit_dimension[], ARRAY['hardware','software']::asset_type[], 2),
(NULL, 'E.28', 'Indisponibilidad del personal', 'Ausencia', 'defects', ARRAY['availability']::magerit_dimension[], ARRAY['personnel']::asset_type[], 2)""")

run("Attacks1", """INSERT INTO threat_catalog (organization_id, code, name, description, origin, affected_dimensions, affected_asset_types, frequency_base) VALUES
(NULL, 'A.5', 'Suplantacion de identidad', 'Impersonacion', 'deliberate', ARRAY['confidentiality','integrity','authenticity']::magerit_dimension[], ARRAY['data','software','service']::asset_type[], 3),
(NULL, 'A.6', 'Abuso de privilegios', 'Uso indebido', 'deliberate', ARRAY['confidentiality','integrity','traceability']::magerit_dimension[], ARRAY['data','software']::asset_type[], 2),
(NULL, 'A.7', 'Uso no previsto', 'Uso no autorizado', 'deliberate', ARRAY['availability','integrity','confidentiality']::magerit_dimension[], ARRAY['software','network']::asset_type[], 2),
(NULL, 'A.8', 'Difusion software danino', 'Malware', 'deliberate', ARRAY['availability','integrity','confidentiality']::magerit_dimension[], ARRAY['software']::asset_type[], 3),
(NULL, 'A.11', 'Acceso no autorizado', 'Sin permisos', 'deliberate', ARRAY['confidentiality','integrity','authenticity']::magerit_dimension[], ARRAY['data','software','hardware','network']::asset_type[], 3)""")

run("Attacks2", """INSERT INTO threat_catalog (organization_id, code, name, description, origin, affected_dimensions, affected_asset_types, frequency_base) VALUES
(NULL, 'A.14', 'Interceptacion', 'Info en transito', 'deliberate', ARRAY['confidentiality']::magerit_dimension[], ARRAY['network','data']::asset_type[], 2),
(NULL, 'A.15', 'Modificacion deliberada', 'Alteracion', 'deliberate', ARRAY['integrity']::magerit_dimension[], ARRAY['data']::asset_type[], 2),
(NULL, 'A.18', 'Destruccion deliberada', 'Eliminacion', 'deliberate', ARRAY['availability']::magerit_dimension[], ARRAY['data']::asset_type[], 2),
(NULL, 'A.19', 'Divulgacion', 'Revelacion', 'deliberate', ARRAY['confidentiality']::magerit_dimension[], ARRAY['data','personnel']::asset_type[], 2),
(NULL, 'A.24', 'Denegacion de servicio', 'DoS', 'deliberate', ARRAY['availability']::magerit_dimension[], ARRAY['network','software','service']::asset_type[], 3),
(NULL, 'A.25', 'Robo', 'Sustraccion', 'deliberate', ARRAY['availability','confidentiality']::magerit_dimension[], ARRAY['hardware','data']::asset_type[], 1),
(NULL, 'A.30', 'Ingenieria social', 'Manipulacion', 'deliberate', ARRAY['confidentiality','integrity','authenticity']::magerit_dimension[], ARRAY['personnel']::asset_type[], 3)""")

print("\n=== FINAL COUNTS ===")
verify_sql = """SELECT 'tables' as item, count(*)::text as cnt FROM pg_tables WHERE schemaname = 'public'
UNION ALL SELECT 'enums', count(*)::text FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
UNION ALL SELECT 'permissions', count(*)::text FROM permissions
UNION ALL SELECT 'frameworks', count(*)::text FROM frameworks
UNION ALL SELECT 'threats', count(*)::text FROM threat_catalog
ORDER BY item"""

data = json.dumps({"query": verify_sql}).encode()
req = urllib.request.Request(
    API, data=data,
    headers={"Authorization": f"Bearer {TK}", "Content-Type": "application/json", "User-Agent": "supabase-mcp/1.0"},
    method="POST",
)
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
for row in result:
    print(f"  {row['item']}: {row['cnt']}")
