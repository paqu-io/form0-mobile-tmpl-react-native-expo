const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));

const cryptoAPI =
  typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues
    ? globalThis.crypto
    : null;

function bytesToUuid(bytes) {
  return (
    HEX[bytes[0]] +
    HEX[bytes[1]] +
    HEX[bytes[2]] +
    HEX[bytes[3]] +
    '-' +
    HEX[bytes[4]] +
    HEX[bytes[5]] +
    '-' +
    HEX[bytes[6]] +
    HEX[bytes[7]] +
    '-' +
    HEX[bytes[8]] +
    HEX[bytes[9]] +
    '-' +
    HEX[bytes[10]] +
    HEX[bytes[11]] +
    HEX[bytes[12]] +
    HEX[bytes[13]] +
    HEX[bytes[14]] +
    HEX[bytes[15]]
  ).toLowerCase();
}

function getRandomBytes(length) {
  if (cryptoAPI?.getRandomValues) {
    const array = new Uint8Array(length);
    cryptoAPI.getRandomValues(array);
    return array;
  }

  const array = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

export function uuidv4() {
  const bytes = getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

export function uuidv7() {
  const bytes = new Uint8Array(16);
  let timestamp = BigInt(Date.now());
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = Number(timestamp & 0xffn);
    timestamp >>= 8n;
  }
  const randomBytes = getRandomBytes(10);
  bytes.set(randomBytes, 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

export function injectMediaFieldUUIDs(values = {}, flattenedFields = []) {
  const clonedValues =
    typeof structuredClone === 'function'
      ? structuredClone(values)
      : JSON.parse(JSON.stringify(values));

  flattenedFields.forEach((field) => {
    if (!field || !field.data_name) {
      return;
    }
    const value = clonedValues[field.data_name];
    if (!value) {
      return;
    }

    if (field.type === 'SignatureField' && typeof value === 'object' && value.data) {
      value.signature_id = uuidv4();
    } else if (field.type === 'PhotoField' && Array.isArray(value)) {
      value.forEach((photo) => {
        if (photo && typeof photo === 'object') {
          photo.photo_id = uuidv4();
        }
      });
    } else if (field.type === 'VideoField' && Array.isArray(value)) {
      value.forEach((video) => {
        if (video && typeof video === 'object') {
          video.video_id = uuidv4();
        }
      });
    }
  });

  return clonedValues;
}

export function ensureRecordOptionIds(options = {}) {
  const next = { ...options };
  if (!next.mainRecordId) {
    next.mainRecordId = uuidv7();
  }
  if (!next.changeset_id) {
    next.changeset_id = uuidv7();
  }
  return next;
}

export function regenerateRepeatableRecordIds(record) {
  if (!record || !record.form_values) {
    return;
  }

  const assignIds = (formValues) => {
    if (!formValues || typeof formValues !== 'object') {
      return;
    }

    Object.values(formValues).forEach((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return;
      }

      const appearsRepeatable = value.every(
        (entry) =>
          entry &&
          typeof entry === 'object' &&
          Object.prototype.hasOwnProperty.call(entry, 'form_values')
      );

      if (!appearsRepeatable) {
        return;
      }

      value.forEach((entry) => {
        if (!entry || typeof entry !== 'object') {
          return;
        }

        const newId = uuidv7();
        entry.id = newId;
        if (!entry.record_id) {
          entry.record_id = newId;
        }

        assignIds(entry.form_values);
      });
    });
  };

  assignIds(record.form_values);
}
