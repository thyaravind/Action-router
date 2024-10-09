import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function fetchActions() {
  try {
    const { data, error } = await supabase
      .from('actions')
      .select(`
        *,
        users (name),
        upvotes (count)
      `)
    if (error) throw error
    
    // Transform the data to include the upvotes count
    const transformedData = data.map(action => ({
      ...action,
      upvotes: action.upvotes[0]?.count || 0
    }))
    
    return transformedData
  } catch (error) {
    console.error('Error fetching actions:', error)
    throw error
  }
}

export async function fetchUserUpvotes(userId: string) {
  try {
    const { data, error } = await supabase
      .from('upvotes')
      .select('action_id')
      .eq('user_id', userId)

    if (error) throw error

    return data.map(upvote => upvote.action_id)
  } catch (error) {
    console.error('Error fetching user upvotes:', error)
    throw error
  }
}

export async function upvoteAction(actionId: number, userId: string) {
  try {
    const { data: newUpvote, error: insertError } = await supabase
      .from('upvotes')
      .insert({ action_id: actionId, user_id: userId })

    if (insertError) throw insertError

    // Fetch the updated upvote count
    const { data: updatedAction, error: countError } = await supabase
      .from('actions')
      .select('*, upvotes (count)')
      .eq('id', actionId)
      .single()

    if (countError) throw countError

    return {
      ...updatedAction,
      upvotes: updatedAction.upvotes[0]?.count || 0
    }
  } catch (error) {
    console.error('Error upvoting action:', error)
    throw error
  }
}

export async function createOrUpdateUser(userId: string, name: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: userId, name }, { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating/updating user:', error)
    throw error
  }
}

export async function getUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user:', error)
  }
}

export async function updateUserName(userId: string, name: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ name })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user name:', error)
    throw error
  }
}

export async function removeUpvote(actionId: number, userId: string) {
  try {
    const { error } = await supabase
      .from('upvotes')
      .delete()
      .eq('action_id', actionId)
      .eq('user_id', userId)

    if (error) throw error

    // Fetch the updated upvote count
    const { data: updatedAction, error: countError } = await supabase
      .from('actions')
      .select('*, upvotes (count)')
      .eq('id', actionId)
      .single()

    if (countError) throw countError

    return {
      ...updatedAction,
      upvotes: updatedAction.upvotes[0]?.count || 0
    }
  } catch (error) {
    console.error('Error removing upvote:', error)
    throw error
  }
}