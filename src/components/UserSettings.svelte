<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '@iconify/svelte';
  import { clerk } from '../lib/clerk';
  import { updateUserName, getUser } from '../lib/supabase';
  import { onMount } from 'svelte';

  export let user;

  const dispatch = createEventDispatcher();

  let name = '';

  onMount(async () => {
    if (user) {
      const userData = await getUser(user.id);
      name = userData?.name || '';
    }
  });

  async function updateName() {
    if (clerk && user) {
      try {
        await updateUserName(user.id, name);
        user.name = name;
        alert('Name updated successfully!');
      } catch (error) {
        console.error('Error updating name:', error);
        alert('Failed to update name. Please try again.');
      }
    }
  }

  function close() {
    dispatch('close');
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="card p-8 w-full max-w-md">
    <h2 class="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">User Settings</h2>
    <div class="mb-4">
      <label for="name" class="block mb-2 text-gray-700 dark:text-gray-300">Name</label>
      <input id="name" bind:value={name} class="input" placeholder="Enter your name" />
    </div>
    <div class="mb-4">
      <label class="block mb-2 text-gray-700 dark:text-gray-300">Email</label>
      <p class="input bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{user?.primaryEmailAddress?.emailAddress || 'No email available'}</p>
    </div>
    <div class="mb-4">
      <label class="block mb-2 text-gray-700 dark:text-gray-300">Account Details</label>
      <p class="input bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
        Created: {new Date(user?.createdAt).toLocaleDateString()}
      </p>
    </div>
    <div class="flex justify-between">
      <button on:click={updateName} class="btn bg-blue-500 hover:bg-blue-600 text-white">
        <Icon icon="ph:check" class="inline-block mr-1" />
        Save Changes
      </button>
      <button on:click={close} class="btn bg-gray-500 hover:bg-gray-600 text-white">
        <Icon icon="ph:x" class="inline-block mr-1" />
        Close
      </button>
    </div>
  </div>
</div>