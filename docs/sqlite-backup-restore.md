# SQLite backup and restore

ClawPark stores its local database in the SQLite file configured by `sqlitePath` / `MARKETPLACE_STORAGE_DIR`.

## Safe backup

Preferred options:

1. **Stop the app and copy the file**
   ```bash
   cp marketplace.sqlite marketplace.sqlite.backup
   ```

2. **Use SQLite's backup command while the app is offline or quiescent**
   ```bash
   sqlite3 marketplace.sqlite ".backup './marketplace.sqlite.backup'"
   ```

If you back up a live database, prefer SQLite's own backup mechanism over raw file copy.

## Restore

1. Stop the app/server.
2. Replace the active file with the backup:
   ```bash
   cp marketplace.sqlite.backup marketplace.sqlite
   ```
3. Start the app again.

## Migration note

The server now records applied schema migrations in `schema_migrations`.
For legacy unversioned databases, startup adopts the existing schema, applies compatibility columns, and records the initial migration instead of recreating the database.
