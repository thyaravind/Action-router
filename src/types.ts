export interface Step {
  id?: number;
  label: string;
  description: string;
  link: string;
}

export interface Action {
  id?: number;
  title: string;
  description: string;
  upvotes: number;
  steps: Step[];
  user_id: string;
  // Remove user_name from here as we'll fetch it dynamically
}