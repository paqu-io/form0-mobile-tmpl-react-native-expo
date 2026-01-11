import * as SQLite from 'expo-sqlite';

const DEFAULT_DB_NAME = 'form0.db';
const DEFAULT_TABLE_NAME = 'form0_submissions';

const state = {
  db: null,
  initPromise: null,
  config: null,
};

function sanitizeIdentifier(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return /^[A-Za-z0-9_]+$/.test(trimmed) ? trimmed : fallback;
}

function resolveStorageConfig(config = {}) {
  return {
    databaseName: config.databaseName || DEFAULT_DB_NAME,
    tableName: sanitizeIdentifier(config.tableName, DEFAULT_TABLE_NAME),
    debug: config.debug === true,
  };
}

function ensureDatabase(config) {
  const resolved = resolveStorageConfig(config);

  if (state.db && state.config?.databaseName === resolved.databaseName) {
    return state.db;
  }

  state.db = SQLite.openDatabase(resolved.databaseName);
  state.config = resolved;
  state.initPromise = null;
  return state.db;
}

function ensureSchema(config) {
  const resolved = resolveStorageConfig(config);
  const db = ensureDatabase(resolved);

  if (state.initPromise) {
    return state.initPromise;
  }

  const tableName = resolved.tableName;

  state.initPromise = new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${tableName} (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id TEXT,
            changeset_id TEXT,
            form_id TEXT,
            status TEXT,
            version INTEGER,
            draft INTEGER,
            created_at TEXT,
            updated_at TEXT,
            created_at_client TEXT,
            updated_at_client TEXT,
            created_at_server TEXT,
            updated_at_server TEXT,
            record_json TEXT NOT NULL,
            created_at_db TEXT DEFAULT CURRENT_TIMESTAMP
          );`
        );

        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_${tableName}_record_id ON ${tableName} (record_id);`
        );
      },
      (error) => {
        state.initPromise = null;
        reject(error);
      },
      () => resolve(db)
    );
  });

  return state.initPromise;
}

export async function storeStructuredRecord(record, options = {}) {
  const config = resolveStorageConfig(options.config || {});
  const db = await ensureSchema(config);

  const payload = JSON.stringify(record);
  const values = [
    record.id || null,
    record.changeset_id || null,
    record.form_id || null,
    record['@status'] || null,
    record.version || null,
    record.draft ? 1 : 0,
    record.created_at || null,
    record.updated_at || null,
    record.created_at_client || null,
    record.updated_at_client || null,
    record.created_at_server || null,
    record.updated_at_server || null,
    payload,
  ];

  const tableName = config.tableName;

  return await new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `INSERT INTO ${tableName} (
            record_id,
            changeset_id,
            form_id,
            status,
            version,
            draft,
            created_at,
            updated_at,
            created_at_client,
            updated_at_client,
            created_at_server,
            updated_at_server,
            record_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          values,
          (_tx, result) => {
            resolve({
              insertId: result.insertId,
              recordId: record.id || null,
            });
          },
          (_tx, error) => {
            reject(error);
            return true;
          }
        );
      },
      (error) => reject(error)
    );
  });
}

export function isLocalStorageEnabled(config = {}) {
  return config.enabled !== false;
}
