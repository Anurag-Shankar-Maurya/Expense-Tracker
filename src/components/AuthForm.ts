import { supabase } from '../supabaseClient';

interface AuthFormProps {
  onSignInSuccess: () => void;
}

export function renderAuthForm(props: AuthFormProps) {
  const appDiv = document.querySelector<HTMLDivElement>('#app')!;
  appDiv.innerHTML = `
    <div class="min-h-screen bg-background text-text p-4 md:p-8 lg:p-12 flex flex-col items-center justify-center">
      <div class="bg-surface p-8 rounded-xl shadow-lg border border-border w-full max-w-md text-center">
        <h2 class="text-3xl font-bold text-primary mb-6">Welcome to Expense Tracker Dashboard</h2>
        <p class="text-textSecondary mb-8">Sign in or create an account to manage your finances.</p>

        <form id="auth-form" class="space-y-4">
          <div>
            <label for="email" class="sr-only">Email</label>
            <input type="email" id="email" placeholder="Email" required
                   class="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-text" />
          </div>
          <div>
            <label for="password" class="sr-only">Password</label>
            <input type="password" id="password" placeholder="Password" required
                   class="w-full p-3 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-text" />
          </div>
          <button type="submit" id="sign-in-btn" class="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50">
            Sign In
          </button>
          <button type="button" id="sign-up-btn" class="w-full px-6 py-3 bg-secondary text-white rounded-lg font-semibold hover:bg-secondary/80 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-secondary/50 mt-2">
            Sign Up
          </button>
        </form>
        <p id="auth-message" class="mt-4 text-sm text-error"></p>
      </div>
    </div>
  `;

  const authForm = document.getElementById('auth-form') as HTMLFormElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const signUpBtn = document.getElementById('sign-up-btn') as HTMLButtonElement;
  const authMessage = document.getElementById('auth-message') as HTMLParagraphElement;

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authMessage.textContent = '';
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      authMessage.textContent = 'Signed in successfully!';
      props.onSignInSuccess();
    } catch (error: any) {
      authMessage.textContent = error.message;
      console.error('Sign In Error:', error);
    }
  });

  signUpBtn.addEventListener('click', async () => {
    authMessage.textContent = '';
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      authMessage.textContent = 'Sign up successful! Please check your email to confirm.';
    } catch (error: any) {
      authMessage.textContent = error.message;
      console.error('Sign Up Error:', error);
    }
  });
}
