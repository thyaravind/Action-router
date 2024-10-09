<script lang="ts">
  import { Router, Route, Link, navigate } from "svelte-routing";
  import Home from "./routes/Home.svelte";
  import CreateAction from "./routes/CreateAction.svelte";
  import ViewAction from "./routes/ViewAction.svelte";
  import MyActions from "./routes/MyActions.svelte";
  import Icon from '@iconify/svelte';
  import { initClerk, clerk } from './lib/clerk';
  import { onMount } from 'svelte';
  import UserSettings from "./components/UserSettings.svelte";
  import { createOrUpdateUser, getUser } from './lib/supabase';

  export let url = "";

  let user = null;
  let clerkError = false;
  let showSettings = false;
  let isDarkMode = false;

  onMount(async () => {
    const initializedClerk = await initClerk();
    if (initializedClerk) {
      initializedClerk.addListener(async (state) => {
        if (state.user) {
          console.log({state})
          const supabaseUser = await getUser(state.user.id);
          if (supabaseUser) {
            user = { ...state.user, name: supabaseUser.name };
          } else {
            user = state.user;
            await createOrUpdateUser(user.id, user.firstName || 'Anonymous');
          }
          console.log({user})
        } else {
          user = null;
        }
      });
    } else {
      clerkError = true;
    }

    // Check for user's theme preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    }
  });

  function signIn() {
    console.log({at: "signin", clerk})
    if (clerk) clerk.openSignIn();
  }

  function signOut() {
    if (clerk) clerk.signOut();
  }

  function toggleSettings() {
    showSettings = !showSettings;
  }

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark');
  }

  function handleCreateAction() {
    if (!user) {
      alert("Please sign in to create an action.");
      signIn();
      return;
    }
    navigate("/create");
  }
</script>

<Router {url}>
  <div class="min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-900 transition-colors duration-300">
    <nav class="bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-lg shadow-lg mb-8">
      <div class="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" class="flex items-center">
          <!-- <img src="/actionrouter.png" alt="ActionRouter Logo" class="h-8 w-8 mr-2" /> -->
          <span class="text-2xl font-bold text-black-600 dark:text-white">Action Router</span>
        </Link>
        <div class="flex items-center space-x-4">
          <button on:click={handleCreateAction} class="btn">
            <Icon icon="ph:plus" class="inline-block mr-1" />
            Create Action
          </button>
          {#if user}
            <Link to="/my-actions" class="btn">
              <Icon icon="ph:list-bullets" class="inline-block mr-1" />
              My Actions
            </Link>
          {/if}
          {#if clerkError}
            <span class="text-red-500">Authentication unavailable</span>
          {:else if user}
            <button on:click={toggleSettings} class="btn" title="Settings">
              <Icon icon="ph:gear" class="inline-block" />
            </button>
            <button on:click={signOut} class="btn bg-red-500 hover:bg-red-600 text-white" title="Sign Out">
              <Icon icon="ph:sign-out" class="inline-block" />
            </button>
          {:else}
            <button on:click={signIn} class="btn bg-green-500 hover:bg-green-600 text-white">
              <Icon icon="ph:sign-in" class="inline-block mr-1" />
              Sign In
            </button>
          {/if}
          <button on:click={toggleTheme} class="btn" title="Toggle Theme">
            <Icon icon={isDarkMode ? "ph:sun" : "ph:moon"} class="inline-block" />
          </button>
        </div>
      </div>
    </nav>

    <main class="container mx-auto px-4">
      <Route path="/" component={Home} />
      <Route path="/create" component={CreateAction} />
      <Route path="/action/:id" component={ViewAction} />
      <Route path="/my-actions" component={MyActions} />
      <Route path="/edit/:id" component={CreateAction} />
    </main>

    {#if showSettings}
      <UserSettings on:close={toggleSettings} {user} />
    {/if}
  </div>
</Router>

<style>
  :global(body) {
    @apply transition-colors duration-300;
  }

  :global(.btn) {
    @apply px-4 py-2 rounded-md transition-all duration-200 ease-in-out text-gray-800 dark:text-gray-200;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 16px 0 rgba(31, 38, 135, 0.27);
  }

  :global(.btn:hover) {
    background: rgba(255, 255, 255, 0.3);
  }

  :global(.card) {
    @apply bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-lg border border-white border-opacity-20 dark:border-gray-700 shadow-lg transition-colors duration-300;
  }

  :global(.input) {
    @apply w-full px-3 py-2 rounded-md bg-white bg-opacity-20 dark:bg-gray-800 dark:bg-opacity-20 backdrop-filter backdrop-blur-lg border border-white border-opacity-20 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300;
  }
</style>