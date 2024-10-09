<script lang="ts">
  import { navigate } from "svelte-routing";
  import Icon from '@iconify/svelte';
  import type { Action, Step } from "../types";
  import { supabase } from '../lib/supabase';
  import { clerk } from '../lib/clerk';
  import { dndzone } from 'svelte-dnd-action';
  import { onMount } from 'svelte';

  export let id: string | undefined = undefined;

  let title = "";
  let description = "";
  let steps: Step[] = [{ id: Date.now(), label: "", description: "", link: "" }];
  let isEditing = false;

  onMount(async () => {
    if (!clerk.user) {
      alert("Please sign in to create or edit an action.");
      navigate("/");
      return;
    }

    if (id) {
      isEditing = true;
      await loadAction(id);
    }
  });

  async function loadAction(actionId: string) {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('id', actionId)
      .single();

    if (error) {
      console.error('Error loading action:', error);
      alert('Failed to load action for editing. Please try again.');
      navigate("/my-actions");
      return;
    }

    title = data.title;
    description = data.description;
    steps = data.steps.map((step, index) => ({ ...step, id: index }));
  }

  function addStep() {
    steps = [...steps, { id: Date.now(), label: "", description: "", link: "" }];
  }

  function removeStep(index: number) {
    steps = steps.filter((_, i) => i !== index);
  }

  function handleDndConsider(e) {
    steps = e.detail.items;
  }

  function handleDndFinalize(e) {
    steps = e.detail.items;
  }

  async function submitAction() {
    if (!clerk.user) {
      alert("Please sign in to create or edit an action.");
      navigate("/");
      return;
    }

    const actionData: Partial<Action> = {
      title,
      description,
      steps: steps.map(({ id, ...step }) => step),
      user_id: clerk.user.id,
    };

    let result;
    if (isEditing) {
      result = await supabase
        .from('actions')
        .update(actionData)
        .eq('id', id);
    } else {
      result = await supabase
        .from('actions')
        .insert([actionData]);
    }

    const { data, error } = result;

    if (error) {
      console.error('Error saving action:', error);
      alert('Failed to save action. Please try again.');
    } else {
      console.log("Action saved:", data);
      navigate("/my-actions");
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
    {isEditing ? 'Edit Action' : 'Create New Action'}
  </h1>
  
  <form on:submit|preventDefault={submitAction} class="space-y-6">
    <div>
      <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
      <input type="text" id="title" bind:value={title} required class="input mt-1" />
    </div>
    
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
      <textarea id="description" bind:value={description} required class="input mt-1" rows="3"></textarea>
    </div>
    
    <div>
      <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-200">Steps</h2>
      <div use:dndzone={{items: steps}} on:consider={handleDndConsider} on:finalize={handleDndFinalize}>
        {#each steps as step, index (step.id)}
          <div class="card p-4 mb-4">
            <div class="flex justify-between items-center mb-2">
              <div class="flex items-center">
                <Icon icon="ph:dots-nine-bold" class="text-gray-400 mr-2 cursor-move" />
                <span class="text-gray-600 dark:text-gray-400">Step {index + 1}</span>
              </div>
              <button type="button" on:click={() => removeStep(index)} class="btn bg-red-500 hover:bg-red-600 text-white">
                <Icon icon="ph:trash" class="inline-block" />
              </button>
            </div>
            <input type="text" bind:value={step.label} placeholder="Step Label" class="input mb-2" />
            <textarea bind:value={step.description} placeholder="Step Description" class="input mb-2" rows="3"></textarea>
            <input type="text" bind:value={step.link} placeholder="Step Link" class="input mb-2" />
          </div>
        {/each}
      </div>
      <button type="button" on:click={addStep} class="btn bg-green-500 hover:bg-green-600 text-white">
        <Icon icon="ph:plus" class="inline-block mr-1" />
        Add Step
      </button>
    </div>
    
    <div>
      <button type="submit" class="btn bg-blue-500 hover:bg-blue-600 text-white">
        <Icon icon="ph:check" class="inline-block mr-1" />
        {isEditing ? 'Update Action' : 'Create Action'}
      </button>
    </div>
  </form>
</div>