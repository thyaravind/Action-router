<script lang="ts">
  import { navigate } from "svelte-routing";
  import Icon from '@iconify/svelte';
  import type { Action } from "../types";
  import { supabase } from '../lib/supabase';
  import { clerk } from '../lib/clerk';
  import { onMount } from 'svelte';

  let actions: Action[] = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    if (!clerk.user) {
      navigate("/");
      return;
    }
    await loadUserActions();
  });

  async function loadUserActions() {
    try {
      const { data, error: fetchError } = await supabase
        .from('actions')
        .select('*')
        .eq('user_id', clerk.user.id);

      if (fetchError) throw fetchError;

      actions = data;
    } catch (e) {
      console.error('Error fetching user actions:', e);
      error = 'Failed to load your actions. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function editAction(actionId: number) {
    navigate(`/edit/${actionId}`);
  }

  function truncateDescription(description: string, maxLength: number = 100) {
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">My Actions</h1>

  {#if isLoading}
    <p class="text-gray-600 dark:text-gray-400">Loading your actions...</p>
  {:else if error}
    <p class="text-red-500 mb-4">{error}</p>
  {:else if actions.length === 0}
    <p class="text-gray-600 dark:text-gray-400">You haven't created any actions yet.</p>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each actions as action (action.id)}
        <div class="card p-6">
          <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{action.title}</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4 h-20 overflow-hidden">{truncateDescription(action.description)}</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">Steps: {action.steps.length}</p>
          <button 
            on:click={() => editAction(action.id)} 
            class="btn bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Icon icon="ph:pencil" class="inline-block mr-1" />
            Edit
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>