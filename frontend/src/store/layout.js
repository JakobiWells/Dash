import { supabase } from '../lib/supabase'
import { loadJSON, saveJSON } from '../lib/localStorage'

// ── localStorage helpers ──────────────────────────────────────────────────────

const STORAGE_KEY = 'toolbox-layout'

export function loadLayout() {
  return loadJSON(STORAGE_KEY, null)
}

export function saveLayout(layout) {
  saveJSON(STORAGE_KEY, layout)
}

// ── Cloud layout CRUD ─────────────────────────────────────────────────────────

// Free users get 1 saved layout. TODO: check isPremium(user) to lift this limit.
export const FREE_LAYOUT_LIMIT = 1

/** Fetch all layouts for the signed-in user (id + name only). */
export async function fetchLayouts() {
  const { data, error } = await supabase
    .from('layouts')
    .select('id, name, created_at')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

/**
 * Insert or update a layout.
 * id=null → create new. Existing id → update.
 * Returns [{ id, name }].
 */
export async function upsertLayout(id, name, layoutData) {
  if (id) {
    const { data, error } = await supabase
      .from('layouts')
      .update({ name, layout_data: layoutData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name')
    if (error) throw error
    return data
  } else {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('layouts')
      .insert({ user_id: user.id, name, layout_data: layoutData })
      .select('id, name')
    if (error) throw error
    return data
  }
}

/** Delete a layout by id. */
export async function deleteLayout(id) {
  const { error } = await supabase.from('layouts').delete().eq('id', id)
  if (error) throw error
}

/** Fetch the full layout_data for a single layout. */
export async function loadLayoutById(id) {
  const { data, error } = await supabase
    .from('layouts')
    .select('layout_data')
    .eq('id', id)
    .single()
  if (error) throw error
  return data?.layout_data ?? null
}
