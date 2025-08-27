import './style.css';
import { supabase } from './supabaseClient';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

// --- Global State ---
let currentSession: any = null;
let categories: any[] = [];
let expenses: any[] = [];
let budgets: any[] = [];
let currentFilter: string = 'This Month'; // Default filter

// Chart instances
let barChart: Chart | null = null;
let lineChart: Chart | null = null;
let pieChart: Chart | null = null;

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

function getChartColors(count: number) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(chartColors[i % chartColors.length]);
  }
  return colors;
}

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
  populateCategoryDropdown();
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
  renderRecentTransactions();
  updateFinancialMetrics();
  renderCharts(); // Update charts after expenses are fetched
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
  renderBudgetGoals();
  updateFinancialMetrics();
  renderCharts(); // Update charts after budgets are fetched (though charts primarily use expenses)
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

// --- Render Functions ---
function renderAuthUI() {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
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
  setupAuthListeners();
}

async function renderDashboardUI() {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="min-h-screen bg-background text-text p-4 md:p-8 lg:p-12 flex flex-col items-center">
      <header class="w-full max-w-7xl mb-10 md:mb-12 lg:mb-16 flex justify-between items-center">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary leading-tight tracking-tight animate-fade-in-down">
          <span class="block">Expense Tracker</span>
          <span class="block text-accent">Dashboard</span>
        </h1>
        <button id="sign-out-btn" class="px-4 py-2 bg-error text-white rounded-lg font-semibold hover:bg-error/80 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-error/50">
          Sign Out
        </button>
      </header>

      <main class="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in">

        <!-- Expense Tracking Section -->
        <section class="lg:col-span-2 bg-surface p-6 md:p-8 rounded-xl shadow-lg border border-border transition-all duration-300 hover:shadow-2xl hover:border-primary/50">
          <h2 class="text-2xl md:text-3xl font-bold text-primary mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 14V9m0 0l-3 3m3-3l3 3m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expense Tracking
          </h2>

          <!-- New Expense Form -->
          <div class="mb-8 p-6 bg-background rounded-lg border border-border">
            <h3 class="text-xl font-semibold text-text mb-4">Log New Expense</h3>
            <form id="add-expense-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="expense-amount" class="block text-sm font-medium text-textSecondary mb-1">Amount</label>
                <input type="number" id="expense-amount" placeholder="e.g., 45.50" class="w-full p-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-text" step="0.01" required />
              </div>
              <div>
                <label for="expense-date" class="block text-sm font-medium text-textSecondary mb-1">Date</label>
                <input type="date" id="expense-date" class="w-full p-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-text" required />
              </div>
              <div class="md:col-span-2">
                <label for="expense-description" class="block text-sm font-medium text-textSecondary mb-1">Description</label>
                <input type="text" id="expense-description" placeholder="e.g., Dinner with friends" class="w-full p-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-text" />
              </div>
              <div class="md:col-span-2">
                <label for="expense-category" class="block text-sm font-medium text-textSecondary mb-1">Category</label>
                <div class="flex items-center space-x-2">
                  <select id="expense-category" class="flex-grow p-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-text" required>
                    <option value="">Select Category</option>
                  </select>
                  <button type="button" id="add-custom-category-btn" class="px-4 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors duration-300 text-sm font-medium whitespace-nowrap">
                    Add Custom
                  </button>
                </div>
              </div>
              <div class="md:col-span-2 flex justify-end">
                <button type="submit" class="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50">
                  Add Expense
                </button>
              </div>
            </form>
          </div>

          <!-- Recent Transactions List -->
          <div>
            <h3 class="text-xl font-semibold text-text mb-4">Recent Transactions</h3>
            <div class="overflow-x-auto bg-background rounded-lg border border-border">
              <table class="min-w-full text-left text-sm">
                <thead class="bg-surface border-b border-border">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-textSecondary font-semibold cursor-pointer hover:text-primary transition-colors">Category</th>
                    <th scope="col" class="px-6 py-3 text-textSecondary font-semibold cursor-pointer hover:text-primary transition-colors">Amount</th>
                    <th scope="col" class="px-6 py-3 text-textSecondary font-semibold cursor-pointer hover:text-primary transition-colors">Date</th>
                    <th scope="col" class="px-6 py-3 text-textSecondary font-semibold cursor-pointer hover:text-primary transition-colors">Description</th>
                  </tr>
                </thead>
                <tbody id="transactions-list">
                  <!-- Transactions will be loaded here -->
                </tbody>
              </table>
              <p id="no-transactions-message" class="p-6 text-center text-textSecondary hidden">No transactions yet. Add your first expense!</p>
            </div>
          </div>
        </section>

        <!-- Budget Management Section -->
        <section class="bg-surface p-6 md:p-8 rounded-xl shadow-lg border border-border transition-all duration-300 hover:shadow-2xl hover:border-primary/50">
          <h2 class="text-2xl md:text-3xl font-bold text-primary mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0-2.08-.402-2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Budget Management
          </h2>

          <div class="space-y-6">
            <!-- Overall Budget Summary -->
            <div class="bg-background p-5 rounded-lg border border-border">
              <h3 class="text-xl font-semibold text-text mb-3">Monthly Overview</h3>
              <div class="flex justify-between items-center mb-2">
                <span class="text-textSecondary">Total Budget:</span>
                <span id="total-budget" class="text-lg font-bold text-primary">$0.00</span>
              </div>
              <div class="flex justify-between items-center mb-2">
                <span class="text-textSecondary">Total Spent:</span>
                <span id="total-spent" class="text-lg font-bold text-error">$0.00</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-textSecondary">Remaining:</span>
                <span id="remaining-budget" class="text-lg font-bold text-success">$0.00</span>
              </div>
              <div class="w-full bg-border rounded-full h-3 mt-4">
                <div id="budget-progress-bar" class="bg-success h-3 rounded-full" style="width: 0%;"></div>
              </div>
              <p id="budget-percentage-text" class="text-sm text-textSecondary mt-2 text-right">0% of budget remaining</p>
            </div>

            <!-- Category Budget Goals -->
            <div class="bg-background p-5 rounded-lg border border-border">
              <h3 class="text-xl font-semibold text-text mb-4">Category Goals</h3>
              <div id="category-budgets-list" class="space-y-4">
                <!-- Category budgets will be loaded here -->
              </div>
              <button id="set-edit-budgets-btn" class="mt-6 w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors duration-300 text-sm font-medium">
                Set/Edit Budgets
              </button>
            </div>
          </div>
        </section>

        <!-- Spending Analytics Section -->
        <section class="lg:col-span-3 bg-surface p-6 md:p-8 rounded-xl shadow-lg border border-border transition-all duration-300 hover:shadow-2xl hover:border-primary/50">
          <h2 class="text-2xl md:text-3xl font-bold text-primary mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mr-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
            </svg>
            Spending Analytics
          </h2>

          <!-- Filtering Options -->
          <div class="mb-8 flex flex-wrap gap-3 justify-center md:justify-start">
            <button id="filter-today" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm data-[active=true]:bg-primary/30 data-[active=true]:text-white">Today</button>
            <button id="filter-last-7-days" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm data-[active=true]:bg-primary/30 data-[active=true]:text-white">Last 7 Days</button>
            <button id="filter-this-month" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm data-[active=true]:bg-primary/30 data-[active=true]:text-white">This Month</button>
            <button id="filter-last-month" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm data-[active=true]:bg-primary/30 data-[active=true]:text-white">Last Month</button>
            <button id="filter-last-6-months" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm data-[active=true]:bg-primary/30 data-[active=true]:text-white">Last 6 Months</button>
            <button id="filter-this-year" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm data-[active=true]:bg-primary/30 data-[active=true]:text-white">This Year</button>
          </div>

          <!-- Key Financial Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div class="bg-background p-5 rounded-lg border border-border flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-105">
              <p class="text-textSecondary text-sm mb-1">Total Spending</p>
              <p id="analytics-total-spending" class="text-3xl font-bold text-error">-$0.00</p>
            </div>
            <div class="bg-background p-5 rounded-lg border border-border flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-105">
              <p class="text-textSecondary text-sm mb-1">Remaining Budget</p>
              <p id="analytics-remaining-budget" class="text-3xl font-bold text-success">$0.00</p>
            </div>
            <div class="bg-background p-5 rounded-lg border border-border flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-105">
              <p class="text-textSecondary text-sm mb-1">Status</p>
              <p id="analytics-status" class="text-3xl font-bold text-success">On Track</p>
            </div>
          </div>

          <!-- Charts Section -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Bar Chart -->
            <div class="bg-background p-6 rounded-lg border border-border h-80 flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
              <canvas id="bar-chart"></canvas>
            </div>
            <!-- Line Chart -->
            <div class="bg-background p-6 rounded-lg border border-border h-80 flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
              <canvas id="line-chart"></canvas>
            </div>
            <!-- Pie Chart -->
            <div class="lg:col-span-2 bg-background p-6 rounded-lg border border-border h-80 flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
              <canvas id="pie-chart"></canvas>
            </div>
          </div>
        </section>

      </main>

      <!-- Budget Edit Modal -->
      <div id="budget-modal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 hidden transition-opacity duration-300 opacity-0">
        <div class="bg-surface p-8 rounded-xl shadow-2xl border border-border w-full max-w-lg transform scale-95 transition-transform duration-300">
          <h3 class="text-2xl font-bold text-primary mb-6 text-center">Set Category Budgets</h3>
          <form id="budget-form" class="space-y-4">
            <div id="budget-inputs-container" class="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              <!-- Budget inputs will be dynamically loaded here -->
            </div>
            <div class="flex justify-end space-x-4 mt-6">
              <button type="button" id="cancel-budget-btn" class="px-6 py-3 bg-textSecondary/20 text-text rounded-lg font-semibold hover:bg-textSecondary/30 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-textSecondary/50">
                Cancel
              </button>
              <button type="submit" class="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/80 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-primary/50">
                Save Budgets
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  setupDashboardListeners();
  await fetchCategories();
  await fetchExpenses();
  await fetchBudgets();
  updateFilterButtons(currentFilter); // Set initial active filter button
  renderCharts(); // Initial chart render after all data is fetched
}

function populateCategoryDropdown() {
  const selectElement = document.getElementById('expense-category') as HTMLSelectElement;
  if (!selectElement) return;

  selectElement.innerHTML = '<option value="">Select Category</option>'; // Clear existing options
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    selectElement.appendChild(option);
  });
}

function renderRecentTransactions() {
  const transactionsList = document.getElementById('transactions-list') as HTMLTableSectionElement;
  const noTransactionsMessage = document.getElementById('no-transactions-message') as HTMLParagraphElement;
  if (!transactionsList || !noTransactionsMessage) return;

  transactionsList.innerHTML = ''; // Clear existing transactions

  if (expenses.length === 0) {
    noTransactionsMessage.classList.remove('hidden');
    return;
  } else {
    noTransactionsMessage.classList.add('hidden');
  }

  expenses.forEach(expense => {
    const row = document.createElement('tr');
    row.className = 'border-b border-border hover:bg-surface/50 transition-colors';
    const amountClass = expense.categories.name === 'Income' ? 'text-success' : 'text-error';
    const formattedAmount = expense.categories.name === 'Income' ? `+$${expense.amount.toFixed(2)}` : `-$${expense.amount.toFixed(2)}`;

    row.innerHTML = `
      <td class="px-6 py-4 font-medium text-primary">${expense.categories.name}</td>
      <td class="px-6 py-4 ${amountClass}">${formattedAmount}</td>
      <td class="px-6 py-4 text-textSecondary">${expense.date}</td>
      <td class="px-6 py-4 text-textSecondary">${expense.description || '-'}</td>
    `;
    transactionsList.appendChild(row);
  });
}

function renderBudgetGoals() {
  const categoryBudgetsList = document.getElementById('category-budgets-list') as HTMLDivElement;
  if (!categoryBudgetsList) return;

  categoryBudgetsList.innerHTML = ''; // Clear existing budgets

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Budget goals are typically monthly, so we use current month expenses for comparison
  const currentMonthExpenses = expenses.filter(exp => {
    const expenseDate = new Date(exp.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  categories.filter(cat => cat.name !== 'Income').forEach(category => {
    const budget = budgets.find(b => b.category_id === category.id);
    const budgetedAmount = budget ? parseFloat(budget.amount) : 0;
    const spentAmount = currentMonthExpenses
      .filter(exp => exp.category_id === category.id)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    const remaining = budgetedAmount - spentAmount;
    const percentageSpent = budgetedAmount > 0 ? (spentAmount / budgetedAmount) * 100 : 0;

    let progressBarColor = 'bg-success';
    if (percentageSpent >= 100) {
      progressBarColor = 'bg-error';
    } else if (percentageSpent >= 80) {
      progressBarColor = 'bg-warning';
    }

    const budgetItem = document.createElement('div');
    budgetItem.innerHTML = `
      <div>
        <div class="flex justify-between items-center mb-1">
          <span class="text-text">${category.name}</span>
          <span class="text-textSecondary text-sm">$${spentAmount.toFixed(2)} / <span class="${remaining < 0 ? 'text-error' : 'text-success'}">$${budgetedAmount.toFixed(2)}</span></span>
        </div>
        <div class="w-full bg-border rounded-full h-2">
          <div class="${progressBarColor} h-2 rounded-full" style="width: ${Math.min(100, percentageSpent)}%;"></div>
        </div>
      </div>
    `;
    categoryBudgetsList.appendChild(budgetItem);
  });
}

function updateFinancialMetrics() {
  const totalBudgetEl = document.getElementById('total-budget');
  const totalSpentEl = document.getElementById('total-spent');
  const remainingBudgetEl = document.getElementById('remaining-budget');
  const budgetProgressBar = document.getElementById('budget-progress-bar') as HTMLDivElement;
  const budgetPercentageText = document.getElementById('budget-percentage-text');

  const analyticsTotalSpendingEl = document.getElementById('analytics-total-spending');
  const analyticsRemainingBudgetEl = document.getElementById('analytics-remaining-budget');
  const analyticsStatusEl = document.getElementById('analytics-status');

  if (!totalBudgetEl || !totalSpentEl || !remainingBudgetEl || !budgetProgressBar || !budgetPercentageText ||
      !analyticsTotalSpendingEl || !analyticsRemainingBudgetEl || !analyticsStatusEl) return;

  const filteredExpenses = getFilteredExpenses(currentFilter);

  // Total budgeted amount is always based on monthly budgets, not filtered by time frame
  const totalBudgetedAmount = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
  
  const totalSpentAmount = filteredExpenses
    .filter(exp => exp.categories.name !== 'Income') // Exclude income from spending
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  
  // Income is not directly used in budget calculation but can be considered for net spending if needed
  // const totalIncomeAmount = filteredExpenses
  //   .filter(exp => exp.categories.name === 'Income')
  //   .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  const remainingOverall = totalBudgetedAmount - totalSpentAmount;
  const percentageRemaining = totalBudgetedAmount > 0 ? (remainingOverall / totalBudgetedAmount) * 100 : 0;

  totalBudgetEl.textContent = `$${totalBudgetedAmount.toFixed(2)}`;
  totalSpentEl.textContent = `-$${totalSpentAmount.toFixed(2)}`;
  remainingBudgetEl.textContent = `$${remainingOverall.toFixed(2)}`;
  remainingBudgetEl.className = `text-lg font-bold ${remainingOverall < 0 ? 'text-error' : 'text-success'}`;

  // Progress bar and percentage text for overall budget (still monthly context)
  budgetProgressBar.style.width = `${Math.max(0, Math.min(100, percentageRemaining))}%`;
  budgetProgressBar.className = `h-3 rounded-full ${percentageRemaining < 20 ? 'bg-error' : percentageRemaining < 50 ? 'bg-warning' : 'bg-success'}`;
  budgetPercentageText.textContent = `${Math.max(0, percentageRemaining).toFixed(0)}% of budget remaining`;

  // Analytics cards update based on currentFilter
  analyticsTotalSpendingEl.textContent = `-$${totalSpentAmount.toFixed(2)}`;
  analyticsRemainingBudgetEl.textContent = `$${remainingOverall.toFixed(2)}`;
  analyticsRemainingBudgetEl.className = `text-3xl font-bold ${remainingOverall < 0 ? 'text-error' : 'text-success'}`;
  analyticsStatusEl.textContent = remainingOverall >= 0 ? 'Under Budget' : 'Over Budget';
  analyticsStatusEl.className = `text-3xl font-bold ${remainingOverall >= 0 ? 'text-success' : 'text-error'}`;
}

// --- Chart Rendering Functions ---
function renderCharts() {
  renderBarChart();
  renderLineChart();
  renderPieChart();
}

function renderBarChart() {
  const ctx = document.getElementById('bar-chart') as HTMLCanvasElement;
  if (!ctx) return;

  if (barChart) {
    barChart.destroy();
  }

  const filteredExpenses = getFilteredExpenses(currentFilter);

  const spendingByCategory: { [key: string]: number } = {};
  filteredExpenses.filter(exp => exp.categories.name !== 'Income').forEach(exp => {
    const categoryName = exp.categories.name;
    spendingByCategory[categoryName] = (spendingByCategory[categoryName] || 0) + parseFloat(exp.amount);
  });

  const labels = Object.keys(spendingByCategory);
  const data = Object.values(spendingByCategory);
  const colors = getChartColors(labels.length);

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Spending',
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => color + '80'), // Slightly transparent border
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Spending by Category (${currentFilter})`,
          color: '#FFFFFF', // text color
          font: {
            size: 16
          }
        },
        legend: {
          display: false // No need for legend if only one dataset
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#A3A3A3' // textSecondary
          },
          grid: {
            color: '#2F2F2F' // border
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#A3A3A3', // textSecondary
            callback: function(value) {
              return '$' + (value as number).toFixed(2);
            }
          },
          grid: {
            color: '#2F2F2F' // border
          }
        }
      }
    }
  });
}

function renderLineChart() {
  const ctx = document.getElementById('line-chart') as HTMLCanvasElement;
  if (!ctx) return;

  if (lineChart) {
    lineChart.destroy();
  }

  const filteredExpenses = getFilteredExpenses(currentFilter);
  const labels: string[] = [];
  const data: number[] = [];

  const now = new Date();

  if (currentFilter === 'Last 6 Months' || currentFilter === 'This Year' || currentFilter === 'Last Month') {
    // Group by month for longer periods
    const monthMap: { [key: string]: number } = {};
    filteredExpenses.filter(exp => exp.categories.name !== 'Income').forEach(exp => {
      const expenseDate = new Date(exp.date);
      const monthYearKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      monthMap[monthYearKey] = (monthMap[monthYearKey] || 0) + parseFloat(exp.amount);
    });

    // Generate labels and data for the selected period
    let tempDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (currentFilter === 'Last Month') {
      tempDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (currentFilter === 'Last 6 Months') {
      tempDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else if (currentFilter === 'This Year') {
      tempDate = new Date(now.getFullYear(), 0, 1);
    }

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month
    if (currentFilter === 'Last Month') {
      endDate.setDate(0); // End of last month
    } else if (currentFilter === 'This Year') {
      endDate.setMonth(11); // End of December
      endDate.setDate(31);
    }

    while (tempDate <= endDate) {
      const label = tempDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthYearKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`;
      labels.push(label);
      data.push(monthMap[monthYearKey] || 0);
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

  } else {
    // Group by day for shorter periods (Today, Last 7 Days, This Month)
    const dayMap: { [key: string]: number } = {};
    filteredExpenses.filter(exp => exp.categories.name !== 'Income').forEach(exp => {
      const expenseDate = new Date(exp.date);
      const dayKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`;
      dayMap[dayKey] = (dayMap[dayKey] || 0) + parseFloat(exp.amount);
    });

    let tempDate: Date;
    let loopEndDate: Date;

    if (currentFilter === 'Today') {
      tempDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      loopEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (currentFilter === 'Last 7 Days') {
      tempDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      loopEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else { // This Month
      tempDate = new Date(now.getFullYear(), now.getMonth(), 1);
      loopEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of this month
    }

    while (tempDate <= loopEndDate) {
      const label = tempDate.toLocaleString('default', { day: 'numeric', month: 'short' });
      const dayKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
      labels.push(label);
      data.push(dayMap[dayKey] || 0);
      tempDate.setDate(tempDate.getDate() + 1);
    }
  }

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Spending',
        data: data,
        borderColor: chartColors[0], // primary color
        backgroundColor: chartColors[0] + '40', // primary color with transparency
        fill: true,
        tension: 0.3,
        pointBackgroundColor: chartColors[0],
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: chartColors[0],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Spending Trends (${currentFilter})`,
          color: '#FFFFFF',
          font: {
            size: 16
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#A3A3A3'
          },
          grid: {
            color: '#2F2F2F'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#A3A3A3',
            callback: function(value) {
              return '$' + (value as number).toFixed(2);
            }
          },
          grid: {
            color: '#2F2F2F'
          }
        }
      }
    }
  });
}

function renderPieChart() {
  const ctx = document.getElementById('pie-chart') as HTMLCanvasElement;
  if (!ctx) return;

  if (pieChart) {
    pieChart.destroy();
  }

  const filteredExpenses = getFilteredExpenses(currentFilter);

  const spendingByCategory: { [key: string]: number } = {};
  filteredExpenses.filter(exp => exp.categories.name !== 'Income').forEach(exp => {
    const categoryName = exp.categories.name;
    spendingByCategory[categoryName] = (spendingByCategory[categoryName] || 0) + parseFloat(exp.amount);
  });

  const labels = Object.keys(spendingByCategory);
  const data = Object.values(spendingByCategory);
  const colors = getChartColors(labels.length);

  pieChart = new Chart(ctx, {
    type: 'doughnut', // Doughnut chart for a modern look
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: '#262626', // surface color for borders
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Spending Distribution by Category (${currentFilter})`,
          color: '#FFFFFF',
          font: {
            size: 16
          }
        },
        legend: {
          display: true,
          position: 'right',
          labels: {
            color: '#A3A3A3',
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
}

// --- Modal Functions ---
function showBudgetModal() {
  const budgetModal = document.getElementById('budget-modal');
  const budgetInputsContainer = document.getElementById('budget-inputs-container');
  if (!budgetModal || !budgetInputsContainer) return;

  budgetInputsContainer.innerHTML = ''; // Clear previous inputs

  categories.filter(cat => cat.name !== 'Income').forEach(category => {
    const existingBudget = budgets.find(b => b.category_id === category.id);
    const budgetedAmount = existingBudget ? parseFloat(existingBudget.amount).toFixed(2) : '0.00';

    const budgetInputDiv = document.createElement('div');
    budgetInputDiv.className = 'flex items-center justify-between';
    budgetInputDiv.innerHTML = `
      <label for="budget-${category.id}" class="block text-text font-medium w-1/2">${category.name}</label>
      <input type="number" id="budget-${category.id}" data-category-id="${category.id}"
             value="${budgetedAmount}" step="0.01" min="0"
             class="w-1/2 p-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-text" />
    `;
    budgetInputsContainer.appendChild(budgetInputDiv);
  });

  budgetModal.classList.remove('hidden', 'opacity-0');
  budgetModal.classList.add('flex', 'opacity-100');
  (budgetModal.children[0] as HTMLElement).classList.remove('scale-95');
  (budgetModal.children[0] as HTMLElement).classList.add('scale-100');
}

function hideBudgetModal() {
  const budgetModal = document.getElementById('budget-modal');
  if (!budgetModal) return;

  budgetModal.classList.remove('flex', 'opacity-100');
  budgetModal.classList.add('hidden', 'opacity-0');
  (budgetModal.children[0] as HTMLElement).classList.remove('scale-100');
  (budgetModal.children[0] as HTMLElement).classList.add('scale-95');
}

/**
 * Updates the visual state of the filter buttons to highlight the active one.
 * @param activeFilter The currently active filter string.
 */
function updateFilterButtons(activeFilter: string) {
  const filterButtons = document.querySelectorAll<HTMLButtonElement>('.mb-8 button');
  filterButtons.forEach(button => {
    if (button.id === `filter-${activeFilter.toLowerCase().replace(/\s/g, '-')}`) {
      button.setAttribute('data-active', 'true');
    } else {
      button.setAttribute('data-active', 'false');
    }
  });
}

// --- Event Listeners ---
function setupAuthListeners() {
  const authForm = document.getElementById('auth-form') as HTMLFormElement;
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const passwordInput = document.getElementById('password') as HTMLInputElement;
  const signInBtn = document.getElementById('sign-in-btn') as HTMLButtonElement;
  const signUpBtn = document.getElementById('sign-up-btn') as HTMLButtonElement;
  const authMessage = document.getElementById('auth-message') as HTMLParagraphElement;

  if (!authForm || !emailInput || !passwordInput || !signInBtn || !signUpBtn || !authMessage) return;

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    authMessage.textContent = '';
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      authMessage.textContent = 'Signed in successfully!';
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

function setupDashboardListeners() {
  const signOutBtn = document.getElementById('sign-out-btn');
  const addExpenseForm = document.getElementById('add-expense-form') as HTMLFormElement;
  const addCustomCategoryBtn = document.getElementById('add-custom-category-btn');
  const setEditBudgetsBtn = document.getElementById('set-edit-budgets-btn');
  const budgetForm = document.getElementById('budget-form') as HTMLFormElement;
  const cancelBudgetBtn = document.getElementById('cancel-budget-btn');

  signOutBtn?.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  });

  addExpenseForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amountInput = document.getElementById('expense-amount') as HTMLInputElement;
    const dateInput = document.getElementById('expense-date') as HTMLInputElement;
    const descriptionInput = document.getElementById('expense-description') as HTMLInputElement;
    const categorySelect = document.getElementById('expense-category') as HTMLSelectElement;

    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const description = descriptionInput.value;
    const category_id = categorySelect.value;

    if (!amount || !date || !category_id) {
      alert('Please fill in all required fields (Amount, Date, Category).');
      return;
    }

    await addExpense({ amount, date, description, category_id });

    // Clear form
    amountInput.value = '';
    dateInput.value = '';
    descriptionInput.value = '';
    categorySelect.value = '';
  });

  addCustomCategoryBtn?.addEventListener('click', async () => {
    const newCategoryName = prompt('Enter new category name:');
    if (newCategoryName && newCategoryName.trim() !== '') {
      await addCustomCategory(newCategoryName.trim());
    }
  });

  setEditBudgetsBtn?.addEventListener('click', async () => {
    showBudgetModal();
  });

  cancelBudgetBtn?.addEventListener('click', () => {
    hideBudgetModal();
  });

  budgetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const budgetInputs = budgetForm.querySelectorAll<HTMLInputElement>('#budget-inputs-container input[type="number"]');
    
    for (const input of Array.from(budgetInputs)) {
      const categoryId = input.dataset.categoryId;
      const amount = parseFloat(input.value);

      if (categoryId && !isNaN(amount) && amount >= 0) {
        await setBudget(categoryId, amount);
      } else {
        alert(`Invalid budget amount for category ID: ${categoryId}. Please enter a valid non-negative number.`);
        return; // Stop submission if any input is invalid
      }
    }
    hideBudgetModal();
    alert('Budgets updated successfully!');
  });

  // Time-frame filter buttons
  const filterButtons = document.querySelectorAll<HTMLButtonElement>('.mb-8 button');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filterText = button.textContent || '';
      currentFilter = filterText;
      updateFilterButtons(currentFilter);
      updateFinancialMetrics();
      renderCharts();
    });
  });
}

// --- Main Application Flow ---
async function handleAuthStateChange(session: any) {
  currentSession = session;
  if (session) {
    await renderDashboardUI(); // Await dashboard rendering to ensure elements are in DOM
  } else {
    renderAuthUI();
  }
}

// Initial check and listen for auth changes
supabase.auth.onAuthStateChange((_, session) => {
  handleAuthStateChange(session);
});

// Immediately check the current session on load
getSession().then(session => {
  handleAuthStateChange(session);
});
