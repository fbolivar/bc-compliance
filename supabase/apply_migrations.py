"""Apply BC Compliance migrations to Supabase via Management API."""
import json
import urllib.request
import re
import sys
import os

API = "https://api.supabase.com/v1/projects/pqboameuqyvszvsrqxiv/database/query"
TOKEN = "sbp_fc49a4206aac45c1302630039a0ee77fa1b7ac01"


def run_sql(sql: str) -> tuple[bool, str]:
    """Execute SQL against Supabase."""
    sql = sql.strip()
    if not sql:
        return True, "empty"

    data = json.dumps({"query": sql}).encode("utf-8")
    req = urllib.request.Request(
        API,
        data=data,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        return True, resp.read().decode("utf-8")[:200]
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        return False, f"HTTP {e.code}: {body[:300]}"
    except Exception as e:
        return False, str(e)[:300]


def split_sql_statements(sql_content: str) -> list[str]:
    """Split SQL file into individual statements, respecting function bodies."""
    # Remove SQL comments (lines starting with --)
    lines = []
    for line in sql_content.split("\n"):
        stripped = line.strip()
        if stripped.startswith("--"):
            continue
        lines.append(line)

    content = "\n".join(lines)

    # Split on semicolons but respect $$ delimited function bodies
    statements = []
    current = ""
    in_dollar_quote = False

    i = 0
    while i < len(content):
        char = content[i]

        # Check for $$ delimiter
        if content[i:i+2] == "$$":
            in_dollar_quote = not in_dollar_quote
            current += "$$"
            i += 2
            continue

        if char == ";" and not in_dollar_quote:
            stmt = current.strip()
            if stmt:
                statements.append(stmt + ";")
            current = ""
        else:
            current += char

        i += 1

    # Add any remaining content
    stmt = current.strip()
    if stmt:
        statements.append(stmt)

    return [s for s in statements if s.strip() and s.strip() != ";"]


def apply_migration_file(filepath: str) -> None:
    """Apply a single migration file."""
    filename = os.path.basename(filepath)
    print(f"\n{'='*60}")
    print(f"APPLYING: {filename}")
    print(f"{'='*60}")

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    statements = split_sql_statements(content)
    print(f"Found {len(statements)} statements")

    success = 0
    errors = 0

    for i, stmt in enumerate(statements, 1):
        # Get a short description of the statement
        first_line = stmt.split("\n")[0][:80]

        ok, result = run_sql(stmt)
        if ok:
            success += 1
            print(f"  [{i}/{len(statements)}] OK: {first_line}")
        else:
            errors += 1
            print(f"  [{i}/{len(statements)}] FAIL: {first_line}")
            print(f"    Error: {result}")

    print(f"\nResults: {success} success, {errors} errors out of {len(statements)} statements")


def main():
    migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")

    migration_files = [
        "00001_bc_compliance_enums_core.sql",
        "00002_bc_compliance_risk_controls.sql",
        "00003_bc_compliance_secops_operations.sql",
        "00004_bc_compliance_functions_rls_seed.sql",
    ]

    for filename in migration_files:
        filepath = os.path.join(migrations_dir, filename)
        if os.path.exists(filepath):
            apply_migration_file(filepath)
        else:
            print(f"WARNING: {filepath} not found, skipping")

    # Verify
    print(f"\n{'='*60}")
    print("VERIFICATION: Listing all tables")
    print(f"{'='*60}")
    ok, result = run_sql("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename")
    if ok:
        tables = json.loads(result)
        print(f"Total tables: {len(tables)}")
        for t in tables:
            print(f"  - {t['tablename']}")
    else:
        print(f"Error: {result}")


if __name__ == "__main__":
    main()
