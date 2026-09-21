// The public build runs without an account, database, or AI credentials.
export const GUEST_MODE = import.meta.env.VITE_GUEST_MODE !== 'false';

export function assetUrl(path) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
