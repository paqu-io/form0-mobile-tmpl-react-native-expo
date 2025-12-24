import { useEffect, useState } from 'react';
import { loadSchemaForForm } from './registry.js';

export function useFormSchema(formId) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    if (!formId) {
      setSchema(null);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);

    loadSchemaForForm(formId)
      .then((loadedSchema) => {
        if (!cancelled) {
          setSchema(loadedSchema);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err);
          setSchema(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [formId]);

  return { schema, loading, error };
}
