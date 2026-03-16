import { useEffect, useState } from "react";

function isValidTabValue(value, allowedValues) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Array.isArray(allowedValues) &&
    allowedValues.includes(value)
  );
}

export default function usePersistentTab(storageKey, defaultValue, allowedValues) {
  const [tab, setTab] = useState(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (isValidTabValue(saved, allowedValues)) {
        return saved;
      }
    } catch {
      // ignore localStorage access errors
    }
    return defaultValue;
  });

  useEffect(() => {
    if (!isValidTabValue(tab, allowedValues)) {
      setTab(defaultValue);
    }
  }, [tab, allowedValues, defaultValue]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, tab);
    } catch {
      // ignore localStorage write errors
    }
  }, [storageKey, tab]);

  return [tab, setTab];
}
