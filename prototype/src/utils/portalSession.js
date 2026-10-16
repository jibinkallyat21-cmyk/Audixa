// Demo portal session: which portal the current tab is signed in to.
// UI-level gating only; there is no backend, so this is not a security boundary.
const KEY = 'audit360_portal'
let memory = null

export const PORTAL_HOME = {
  client: '/client/dashboard',
  team: '/team/dashboard',
  manager: '/manager/dashboard',
  fo: '/fo/dashboard',
  management: '/management/dashboard',
}

export function getPortal() {
  try { return sessionStorage.getItem(KEY) || memory } catch { return memory }
}

export function setPortal(portal) {
  memory = portal
  try { sessionStorage.setItem(KEY, portal) } catch {}
}

export function clearPortal() {
  memory = null
  try { sessionStorage.removeItem(KEY) } catch {}
}

export function homeFor(portal) {
  return PORTAL_HOME[portal] || '/login'
}
