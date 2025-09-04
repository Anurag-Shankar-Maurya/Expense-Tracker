import './style.css';
import { supabase } from './supabaseClient';
import { renderAuthForm } from './components/AuthForm';
import { renderDashboardLayout } from './components/DashboardLayout';

// --- Global State ---
let currentSession: any = null;
let categories: any[] = [];
let expenses: any[] = [];
let budgets: any[] = [];
let currentFilter: string = 'This Month'; // Default filter

// Pagination state for Recent Transactions
let recentTransactionsCurrentPage: number = 1;
const RECENT_TRANSACTIONS_PER_PAGE: number = 10; // Display 10 transactions per page

// Filter state for Recent Transactions
let recentTransactionsCategoryFilter: string = 'all'; // 'all' or category ID
let recentTransactionsDescriptionFilter: string = ''; // Search term

// Chart Colors (derived from user's palette and additional vibrant colors)
const chartColors = [
  '#9E7FFF', // primary
  '#38bdf8', // secondary
  '#f472b6', // accent
  '#10b981', // success
  '#f59e0b', // warning
  '#ef4444', // error
  '#60a5fa', // blue-400
  '#a78bfa', // violet-400
  '#fb7185', // rose-400
  '#34d399', // emerald-400
  '#facc15', // yellow-400
  '#e879f9', // fuchsia-400
];

// --- Utility Functions ---
async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
}

async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, is_default')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  categories = data;
  return data;
}

async function addCustomCategory(categoryName: string) {
  if (!currentSession) return;
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: categoryName, user_id: currentSession.user.id, is_default: false })
    .select();

  if (error) {
    console.error('Error adding custom category:', error);
    alert('Failed to add custom category. It might already exist.');
    return null;
  }
  await fetchCategories(); // Re-fetch to update dropdown
  await renderApp(); // Re-render dashboard to update category dropdown in expense form
  return data[0];
}

async function fetchExpenses() {
  if (!currentSession) return;
  const { data, error } = await supabase
    .from('expenses')
    .select('*, categories(name)')
    .eq('user_id', currentSession.user.id)
    .order('date', { ascending: false })
    .limit(500); // Fetch more expenses for analytics over longer periods

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }
  expenses = data;
  return data;
}

async function addExpense(expenseData: { amount: number; date: string; description: string; category_id: string }) {
  if (!currentSession) return;
  const { data, error } = await supabase
    .from('expenses')
    .insert({ ...expenseData, user_id: currentSession.user.id })
    .select();

  if (error) {
    console.error('Error adding expense:', error);
    alert('Failed to add expense.');
    return null;
  }
  await fetchExpenses(); // Re-fetch to update list and charts
  await renderApp(); // Re-render dashboard
  return data[0];
}

async function fetchBudgets() {
  if (!currentSession) return;
  const { data, error } = await supabase
    .from('budgets')
    .select('*, categories(name)')
    .eq('user_id', currentSession.user.id);

  if (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
  budgets = data;
  return data;
}

async function setBudget(categoryId: string, amount: number) {
  if (!currentSession) return;
  const { data, error } = await supabase
    .from('budgets')
    .upsert({ user_id: currentSession.user.id, category_id: categoryId, amount: amount }, { onConflict: 'user_id, category_id' })
    .select();

  if (error) {
    console.error('Error setting budget:', error);
    alert('Failed to set budget.');
    return null;
  }
  await fetchBudgets(); // Re-fetch to update list
  await renderApp(); // Re-render dashboard
  return data[0];
}

/**
 * Filters expenses based on the selected time frame.
 * @param filter The time frame filter ('Today', 'Last 7 Days', 'This Month', 'Last Month', 'Last 6 Months', 'This Year').
 * @returns An array of filtered expenses.
 */
function getFilteredExpenses(filter: string): any[] {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today

  switch (filter) {
    case 'Today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'Last 7 Days':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      break;
    case 'This Month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'Last Month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999); // End of last month
      break;
    case 'Last 6 Months':
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      break;
    case 'This Year':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // Default to This Month
      break;
  }

  return expenses.filter(exp => {
    const expenseDate = new Date(exp.date);
    return expenseDate >= startDate && expenseDate <= endDate;
  });
}

// --- Main Application Render Function ---
async function renderApp() {
  if (currentSession) {
    await fetchCategories();
    await fetchExpenses();
    await fetchBudgets();

    renderDashboardLayout({
      categories,
      expenses,
      budgets,
      currentFilter,
      chartColors,
      onSignOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error);
      },
      onAddExpense: addExpense,
      onAddCustomCategory: addCustomCategory,
      onSetBudget: setBudget,
      onFilterChange: (filter: string) => {
        currentFilter = filter;
        renderApp(); // Re-render dashboard to update metrics and charts
      },
      getFilteredExpenses: getFilteredExpenses,
      // Props for RecentTransactions pagination
      recentTransactionsCurrentPage: recentTransactionsCurrentPage,
      recentTransactionsItemsPerPage: RECENT_TRANSACTIONS_PER_PAGE,
      onRecentTransactionsPageChange: (page: number) => {
        recentTransactionsCurrentPage = page;
        renderApp(); // Re-render dashboard to update recent transactions table
      },
      // Props for RecentTransactions filters
      recentTransactionsCategoryFilter: recentTransactionsCategoryFilter,
      recentTransactionsDescriptionFilter: recentTransactionsDescriptionFilter,
      onRecentTransactionsFilterChange: (filters: { categoryId?: string; description?: string }) => {
        if (filters.categoryId !== undefined) {
          recentTransactionsCategoryFilter = filters.categoryId;
        }
        if (filters.description !== undefined) {
          recentTransactionsDescriptionFilter = filters.description;
        }
        recentTransactionsCurrentPage = 1; // Reset to first page on filter change
        renderApp(); // Re-render dashboard to apply new filters
      },
    });
  } else {
    renderAuthForm({
      onSignInSuccess: () => {
        getSession().then(session => handleAuthStateChange(session));
      }
    });
  }
}

// --- Auth State Change Handler ---
async function handleAuthStateChange(session: any) {
  currentSession = session;
  // Reset recent transactions page and filters on auth state change (e.g., login/logout)
  recentTransactionsCurrentPage = 1;
  recentTransactionsCategoryFilter = 'all';
  recentTransactionsDescriptionFilter = '';
  await renderApp();
}

// Initial check and listen for auth changes
supabase.auth.onAuthStateChange((_, session) => {
  handleAuthStateChange(session);
});

// Immediately check the current session on load
getSession().then(session => {
  handleAuthStateChange(session);
});
