from pathlib import Path
import shutil
import sqlite3
from datetime import datetime

root = Path.cwd()
db_path = root / "prisma" / "dev.db"
sql_path = root / "prisma" / "migrations" / "20261024090000_add_social_accounts" / "migration.sql"
if not db_path.exists():
    raise SystemExit(f"Database not found: {db_path}")
if not sql_path.exists():
    raise SystemExit(f"Migration SQL not found: {sql_path}")

con = sqlite3.connect(db_path)
try:
    existing = con.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='SocialAccount'").fetchone()
    if existing:
        print("SocialAccount already exists; no changes made.")
        raise SystemExit(0)
    integrity = con.execute("PRAGMA integrity_check").fetchone()[0]
    if integrity != "ok":
        raise SystemExit(f"Database integrity check failed: {integrity}")
    users_before = con.execute('SELECT COUNT(*) FROM "User"').fetchone()[0]
finally:
    con.close()

backup = db_path.with_name(f"dev.db.before-social-account-{datetime.now().strftime('%Y%m%d-%H%M%S')}.bak")
shutil.copy2(db_path, backup)
print(f"Backup created: {backup}")
sql = sql_path.read_text(encoding="utf-8")
con = sqlite3.connect(db_path)
error = None
try:
    con.execute("PRAGMA foreign_keys=ON")
    con.executescript("BEGIN IMMEDIATE;\n" + sql)
    integrity = con.execute("PRAGMA integrity_check").fetchone()[0]
    users_after = con.execute('SELECT COUNT(*) FROM "User"').fetchone()[0]
    social_exists = con.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='SocialAccount'").fetchone()
    fk_issues = con.execute("PRAGMA foreign_key_check").fetchall()
    if integrity != "ok" or users_before != users_after or not social_exists or fk_issues:
        raise RuntimeError(f"Post-check failed: integrity={integrity}, users={users_before}->{users_after}, social={bool(social_exists)}, fk_issues={fk_issues}")
    con.commit()
except Exception as exc:
    con.rollback()
    error = exc
finally:
    con.close()

if error:
    shutil.copy2(backup, db_path)
    print("Migration failed; original database restored from the backup created by this script.")
    raise error

print("Migration successful.")
print(f"Integrity: {integrity}; users preserved: {users_after}; SocialAccount table: present; foreign-key issues: {len(fk_issues)}")
