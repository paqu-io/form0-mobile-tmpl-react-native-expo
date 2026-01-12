import { openDatabaseAsync } from 'expo-sqlite';

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

function normalizeLimit(limit, fallback) {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return fallback;
  }
  const rounded = Math.floor(limit);
  if (rounded <= 0) {
    return fallback;
  }
  return Math.min(rounded, 50);
}

async function ensureDatabase(config) {
  const resolved = resolveStorageConfig(config);

  if (state.db && state.config?.databaseName === resolved.databaseName) {
    return state.db;
  }

  state.db = await openDatabaseAsync(resolved.databaseName);
  state.config = resolved;
  state.initPromise = null;
  return state.db;
}

async function ensureSchema(config) {
  const resolved = resolveStorageConfig(config);
  const db = await ensureDatabase(resolved);

  if (state.initPromise) {
    return state.initPromise;
  }

  const tableName = resolved.tableName;

  state.initPromise = (async () => {
    try {
      await db.execAsync(
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

      await db.execAsync(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_record_id ON ${tableName} (record_id);`
      );
      return db;
    } catch (error) {
      state.initPromise = null;
      throw error;
    }
  })();

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

  const result = await db.runAsync(
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
    ...values
  );

  return {
    insertId: result.lastInsertRowId,
    recordId: record.id || null,
  };
}

export async function getRecentStoredRecords(options = {}) {
  const config = resolveStorageConfig(options.config || {});
  const limit = normalizeLimit(options.limit, 10);
  const db = await ensureSchema(config);
  const tableName = config.tableName;

  const rows = await db.getAllAsync(
    `SELECT
      id,
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
      record_json,
      created_at_db
    FROM ${tableName}
    ORDER BY id DESC
    LIMIT ${limit};`
  );

  return rows;
}

export async function getAllStoredRecords(options = {}) {
  const config = resolveStorageConfig(options.config || {});
  const db = await ensureSchema(config);
  const tableName = config.tableName;

  return await db.getAllAsync(
    `SELECT
      id,
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
      record_json,
      created_at_db
    FROM ${tableName}
    ORDER BY id DESC;`
  );
}

export async function clearStoredRecords(options = {}) {
  const config = resolveStorageConfig(options.config || {});
  const db = await ensureSchema(config);
  const tableName = config.tableName;
  const result = await db.runAsync(`DELETE FROM ${tableName};`);

  return {
    changes: result.changes,
  };
}

export function isLocalStorageEnabled(config = {}) {
  return config.enabled !== false;
}
