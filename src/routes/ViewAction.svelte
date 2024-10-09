<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { Action } from "../types";
  import { supabase, upvoteAction, removeUpvote, fetchUserUpvotes } from '../lib/supabase';
  import { clerk } from '../lib/clerk';
  import { onMount } from 'svelte';

  export let id: string;

  let action: Action | null = null;
  let error: string | null = null;
  let hasUpvoted: boolean = false;
  let isLoading = true;

  onMount(async () => {
    try {
      await loadData();
    } catch (e) {
      console.error('Error fetching action:', e);
      error = 'Failed to load action. Please try again.';
    } finally {
      isLoading = false;
    }
  });

  async function loadData() {
    const { data, error: fetchError } = await supabase
      .from('actions')
      .select(`
        *,
        users (name),
        upvotes (count)
      `)
      .eq('id', id)
      .single();
    
    if (fetchError) throw fetchError;

    action = {
      ...data,
      upvotes: data.upvotes[0]?.count || 0
    };

    if (clerk.user) {
      const upvotedActions = await fetchUserUpvotes(clerk.user.id);
      hasUpvoted = upvotedActions.includes(parseInt(id));
    }
  }

  async function handleUpvoteToggle() {
    if (!clerk.user) {
      alert("Please sign in to upvote an action.");
      return;
    }

    if (!action) return;

    try {
      let updatedAction;
      if (hasUpvoted) {
        updatedAction = await removeUpvote(action.id, clerk.user.id);
      } else {
        updatedAction = await upvoteAction(action.id, clerk.user.id);
      }
      
      if (updatedAction) {
        action = updatedAction;
        hasUpvoted = !hasUpvoted;
      } else {
        throw new Error('Failed to update action');
      }
    } catch (e) {
      console.error('Error toggling upvote:', e);
      alert('Failed to update upvote. Please try again.');
    }
  }

  $: console.log('Has upvoted:', hasUpvoted);
</script>

<div class="container mx-auto px-4 py-8">
  {#if isLoading}
    <p class="text-gray-600 dark:text-gray-400">Loading...</p>
  {:else if error}
    <p class="text-red-500 mb-4">{error}</p>
  {:else if action}
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-200">{action.title}</h1>
      <button 
        on:click={handleUpvoteToggle} 
        class="btn {hasUpvoted ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white"
      >
        <Icon icon={hasUpvoted ? "ph:thumbs-up-fill" : "ph:thumbs-up"} class="inline-block mr-1" />
        {hasUpvoted ? 'Upvoted' : 'Upvote'} ({action.upvotes})
      </button>
    </div>
    <p class="text-gray-600 dark:text-gray-400 mb-4">{action.description}</p>
    <p class="text-sm text-gray-500 dark:text-gray-500 mb-2">Created by: {action.users?.name || 'Anonymous'}</p>
    <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">Number of steps: {action.steps.length}</p>
    
    <h2 class="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Steps</h2>
    {#each action.steps as step, index}
      <div class="card p-4 mb-4">
        <h3 class="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Step {index + 1}: {step.label}</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-2">{step.description}</p>
        {#if step.link}
          <a href={step.link} target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">
            <Icon icon="ph:link" class="inline-block mr-1" />
            Learn More
          </a>
        {/if}
      </div>
    {/each}
  {:else}
    <p class="text-gray-600 dark:text-gray-400">No action found.</p>
  {/if}
</div>