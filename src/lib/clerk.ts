import Clerk from '@clerk/clerk-js';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing Clerk publishable key')
}

export let clerk: Clerk | null = null;

export async function initClerk() {
  try {
    clerk = new Clerk(publishableKey);
    await clerk.load();
    return clerk;
  } catch (error) {
    console.error('Failed to initialize Clerk:', error);
    return null;
  }
}

export async function getUser(userId: string) {
  if (!clerk) {
    console.error('Clerk not initialized');
    return null;
  }
  try {
    return await clerk.users.getUser(userId);
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}