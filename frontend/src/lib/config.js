const appendApiSuffix = (base) => {
  const trimmed = base.replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const resolveApiBaseUrl = () => {
  const raw = import.meta.env.VITE_API_URL?.trim();

  if (!raw) {
    return '/api';
  }

  if (raw.startsWith('/')) {
    return appendApiSuffix(raw);
  }

  try {
    const url = new URL(raw);
    const normalized = url.href.replace(/\/$/, '');
    return appendApiSuffix(normalized);
  } catch (err) {
    console.warn('[config] Invalid VITE_API_URL provided, falling back to /api', err);
    return '/api';
  }
};

export const API_BASE_URL = resolveApiBaseUrl();

export const logApiConfig = () => {
  if (import.meta.env.DEV) {
    console.info('[config] API base set to', API_BASE_URL);
  }
};
