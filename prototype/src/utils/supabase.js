// Supabase connection and sign-in. Both values come from .env.local (see .env.example); without them the app runs on browser storage only, as before.
// To move to the company account: change the two values and recreate the `kv` table and the users; nothing else in the app refers to Supabase.
import { createClient } from '@supabase/supabase-js'
import { connectCloud, disconnectCloud } from './store.js'
import { setPortal, clearPortal } from './portalSession.js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_KEY
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null
export const cloudOn = !!supabase

// The portal a user belongs to is fixed in their account (app metadata), not chosen on screen.
const PORTALS = ['client', 'team', 'manager', 'fo', 'management']
export const portalOf = (user) => { const p = user?.app_metadata?.portal; return PORTALS.includes(p) ? p : null }

async function open(session) {
  const portal = portalOf(session.user)
  if (!portal) throw new Error('This account has no portal assigned.')
  await connectCloud(supabase)
  setPortal(portal)
  return { portal, title: session.user.app_metadata?.title || '', email: session.user.email }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message === 'Invalid login credentials' ? 'The email or password is not correct.' : error.message)
  return open(data.session)
}
// Restores a signed-in session after a page reload. Returns null when nobody is signed in.
export async function restoreSession() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  if (!data.session) { clearPortal(); return null }
  try { return await open(data.session) } catch { await supabase.auth.signOut(); clearPortal(); return null }
}
export async function signOut() {
  if (!supabase) return
  await disconnectCloud()
  await supabase.auth.signOut()
}
