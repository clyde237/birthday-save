import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('birthdaysave.db');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: SQLite.SQLiteDatabase): void {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS global_settings (
      id TEXT PRIMARY KEY NOT NULL,
      day_before_enabled INTEGER NOT NULL DEFAULT 1,
      day_before_hour INTEGER NOT NULL DEFAULT 19,
      day_before_minute INTEGER NOT NULL DEFAULT 0,
      same_day_enabled INTEGER NOT NULL DEFAULT 1,
      same_day_hour INTEGER NOT NULL DEFAULT 6,
      same_day_minute INTEGER NOT NULL DEFAULT 0
    );

    INSERT OR IGNORE INTO global_settings (id, day_before_enabled, day_before_hour, day_before_minute, same_day_enabled, same_day_hour, same_day_minute)
    VALUES ('global', 1, 19, 0, 1, 6, 0);

    CREATE TABLE IF NOT EXISTS birthdays (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      birth_day INTEGER NOT NULL,
      birth_month INTEGER NOT NULL,
      birth_year INTEGER,
      notes TEXT,
      reminder_mode TEXT NOT NULL DEFAULT 'default',
      custom_day_before_enabled INTEGER NOT NULL DEFAULT 1,
      custom_day_before_hour INTEGER NOT NULL DEFAULT 19,
      custom_day_before_minute INTEGER NOT NULL DEFAULT 0,
      custom_same_day_enabled INTEGER NOT NULL DEFAULT 1,
      custom_same_day_hour INTEGER NOT NULL DEFAULT 6,
      custom_same_day_minute INTEGER NOT NULL DEFAULT 0,
      notification_ids TEXT NOT NULL DEFAULT '[]',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Migration défensive si la table existait déjà sans les colonnes Lot 3
  const columns = db.getAllSync<{ name: string }>(`PRAGMA table_info(birthdays);`);
  const colNames = columns.map((c) => c.name);

  if (!colNames.includes('reminder_mode')) {
    db.execSync(`ALTER TABLE birthdays ADD COLUMN reminder_mode TEXT NOT NULL DEFAULT 'default';`);
  }
  if (!colNames.includes('custom_day_before_enabled')) {
    db.execSync(`ALTER TABLE birthdays ADD COLUMN custom_day_before_enabled INTEGER NOT NULL DEFAULT 1;`);
  }
  if (!colNames.includes('custom_day_before_hour')) {
    db.execSync(`ALTER TABLE birthdays ADD COLUMN custom_day_before_hour INTEGER NOT NULL DEFAULT 19;`);
  }
  if (!colNames.includes('custom_day_before_minute')) {
    db.execSync(`ALTER TABLE birthdays ADD COLUMN custom_day_before_minute INTEGER NOT NULL DEFAULT 0;`);
  }
  if (!colNames.includes('custom_same_day_enabled')) {
    db.execSync(`ALTER TABLE birthdays ADD COLUMN custom_same_day_enabled INTEGER NOT NULL DEFAULT 1;`);
  }
  if (!colNames.includes('custom_same_day_hour')) {
    db.execSync(`ALTER TABLE birthdays ADD COLUMN custom_same_day_hour INTEGER NOT NULL DEFAULT 6;`);
  }
  if (!colNames.includes('custom_same_day_minute')) {
    db.execSync(`ALTER TABLE birthdays ADD COLUMN custom_same_day_minute INTEGER NOT NULL DEFAULT 0;`);
  }
  if (!colNames.includes('notification_ids')) {
    db.execSync(`ALTER TABLE birthdays ADD COLUMN notification_ids TEXT NOT NULL DEFAULT '[]';`);
  }

  // Remplissage des valeurs NULL éventuelles pour les anciennes lignes Lot 2
  db.execSync(`
    UPDATE birthdays SET reminder_mode = 'default' WHERE reminder_mode IS NULL OR reminder_mode = '';
    UPDATE birthdays SET notification_ids = '[]' WHERE notification_ids IS NULL OR notification_ids = '';
  `);
}
