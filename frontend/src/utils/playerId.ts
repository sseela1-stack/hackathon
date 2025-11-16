/**
 * Utility for managing stable player ID in localStorage
 */
export function getPlayerId(): string {
  const k = 'finquest_pid';
  let id = localStorage.getItem(k);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(k, id);
  }
  return id;
}
