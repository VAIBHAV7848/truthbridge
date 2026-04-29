/**
 * TruthBridge — Engineer Tasks Service
 *
 * CRUD for engineer task assignments.
 */
import { supabase } from './supabase';

/**
 * Create a new task assigned to an engineer.
 * Required fields: bridge_id, assigned_by, assigned_to, title
 */
export async function createTask({
  bridge_id,
  bridge_name,
  report_id,
  assigned_by,
  assigned_to,
  title,
  description,
  priority = 'MEDIUM',
  due_date,
}) {
  const { data, error } = await supabase
    .from('engineer_tasks')
    .insert({
      bridge_id,
      bridge_name,
      report_id,
      assigned_by,
      assigned_to,
      title,
      description,
      priority,
      due_date,
      status: 'OPEN',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all tasks assigned to a specific engineer.
 */
export async function getTasksForEngineer(engineerId) {
  const { data, error } = await supabase
    .from('engineer_tasks')
    .select('*')
    .eq('assigned_to', engineerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get all tasks assigned by a specific authority.
 */
export async function getTasksAssignedByAuthority(authorityId) {
  const { data, error } = await supabase
    .from('engineer_tasks')
    .select(`
      *,
      assigned_to:engineers(id, name, specialization)
    `)
    .eq('assigned_by', authorityId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Update task status (e.g., OPEN → IN_PROGRESS → COMPLETED).
 * Also sets completed_at when status becomes COMPLETED.
 */
export async function updateTaskStatus(taskId, status, completionNotes = '') {
  const updates = { status };
  if (completionNotes) updates.completion_notes = completionNotes;
  if (status === 'COMPLETED') updates.completed_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('engineer_tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
