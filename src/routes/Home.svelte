<script lang="ts">
  import { Link, navigate } from "svelte-routing";
  import Icon from '@iconify/svelte';
  import type { Action } from "../types";
  import { fetchActions, upvoteAction, removeUpvote, fetchUserUpvotes } from '../lib/supabase';
  import { clerk } from '../lib/clerk';
  import { onMount, onDestroy } from 'svelte';

  let actions: Action[] = [];
  let filteredActions: Action[] = [];
  let error: string | null = null;
  let userUpvotes: Set<number> = new Set();
  let isLoading = true;
  let userId: string | null = null;
  let unsubscribe: (() => void) | null = null;
  let searchQuery: string = '';

  onMount(() => {
    loadData();
    
    unsubscribe = clerk.addListener((state) => {
      if (state.user) {
        userId = state.user.id;
        loadUserUpvotes();
      } else {
        userId = null;
        userUpvotes = new Set();
      }
    });
  });

  onDestroy(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  async function loadData() {
    try {
      actions = await fetchActions();
      filteredActions = actions;
      if (clerk.user) {
        userId = clerk.user.id;
        await loadUserUpvotes();
      }
    } catch (e) {
      console.error("Error loading data:", e);
      error = e.message || 'An error occurred while fetching actions';
    } finally {
      isLoading = false;
    }
  }

  async function loadUserUpvotes() {
    if (userId) {
      const upvotedActions = await fetchUserUpvotes(userId);
      userUpvotes = new Set(upvotedActions);
    }
  }

  async function handleUpvoteToggle(event: Event, actionId: number) {
    event.stopPropagation();
    if (!userId) {
      alert("Please sign in to upvote an action.");
      return;
    }

    try {
      let updatedAction;
      if (userUpvotes.has(actionId)) {
        updatedAction = await removeUpvote(actionId, userId);
        userUpvotes.delete(actionId);
      } else {
        updatedAction = await upvoteAction(actionId, userId);
        userUpvotes.add(actionId);
      }
      actions = actions.map(action => action.id === actionId ? {...action, upvotes: updatedAction.upvotes} : action);
      filteredActions = filteredActions.map(action => action.id === actionId ? {...action, upvotes: updatedAction.upvotes} : action);
      userUpvotes = new Set(userUpvotes); // Trigger reactivity
    } catch (e) {
      console.error('Error toggling upvote:', e);
      alert('Failed to update upvote. Please try again.');
    }
  }

  function viewAction(actionId: number) {
    navigate(`/action/${actionId}`);
  }

  function handleSearch() {
    if (searchQuery.trim() === '') {
      filteredActions = actions;
    } else {
      filteredActions = actions.filter(action => 
        action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
  }

  function truncateDescription(description: string, maxLength: number = 100) {
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength) + '...';
  }

  $: {
    console.log('Actions updated:', actions);
    console.log('User upvotes:', Array.from(userUpvotes));
  }

  $: actionsWithUpvoteStatus = filteredActions.map(action => ({
    ...action,
    hasUpvoted: userUpvotes.has(action.id)
  }));
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-6">
    <div class="flex items-center">
      <input
        type="text"
        bind:value={searchQuery}
        on:input={handleSearch}
        placeholder="Search actions..."
        class="input flex-grow"
      />
    </div>
  </div>

  {#if isLoading}
    <p class="text-gray-600 dark:text-gray-400">Loading...</p>
  {:else if error}
    <p class="text-red-500 mb-4">{error}</p>
  {:else if actionsWithUpvoteStatus.length === 0}
    <p class="text-gray-600 dark:text-gray-400">
      {searchQuery ? 'No actions found matching your search.' : 'No actions available. Be the first to create one!'}
    </p>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each actionsWithUpvoteStatus as action (action.id)}
        <div 
          class="card p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02]"
          on:click={() => viewAction(action.id)}
        >
          <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">{action.title}</h2>
          <p class="text-gray-600 dark:text-gray-400 mb-4 h-20 overflow-hidden">{truncateDescription(action.description)}</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mb-2">Created by: {action.users?.name || 'Anonymous'}</p>
          <p class="text-sm text-gray-500 dark:text-gray-500 mb-4">Steps: {action.steps.length}</p>
          <div class="flex justify-between items-center">
            <button 
              on:click={(e) => handleUpvoteToggle(e, action.id)} 
              class="btn {action.hasUpvoted ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200"
            >
              <Icon icon={action.hasUpvoted ? "ph:thumbs-up-fill" : "ph:thumbs-up"} class="inline-block mr-1" />
              {action.hasUpvoted ? 'Upvoted' : 'Upvote'} ({action.upvotes})
            </button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card {
    @apply bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg border border-white border-opacity-20 dark:border-gray-700 shadow-lg transition-all duration-300;
  }

  .card:hover {
    @apply bg-opacity-30 dark:bg-opacity-30;
  }
</style>