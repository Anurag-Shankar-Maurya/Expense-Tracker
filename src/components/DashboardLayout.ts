import { renderExpenseForm } from './ExpenseForm';
import { renderRecentTransactions } from './RecentTransactions';
import { renderBudgetSummary } from './BudgetSummary';
import { renderBudgetGoals } from './BudgetGoals';
import { renderAnalyticsControls } from './AnalyticsControls';
import { renderFinancialMetrics } from './FinancialMetrics';
import { renderBarChart } from './BarChart';
import { renderLineChart } from './LineChart';
import { renderPieChart } from './PieChart';
import { renderBudgetModal, showBudgetModal, hideBudgetModal } from './BudgetModal';

interface DashboardLayoutProps {
  categories: any[];
  expenses: any[];
  budgets: any[];
  currentFilter: string;
  chartColors: string[];
  onSignOut: () => void;
  onAddExpense: (expenseData: { amount: number; date: string; description: string; category_id: string }) => Promise<void>;
  onAddCustomCategory: (categoryName: string) => Promise<void>;
  onSetBudget: (categoryId: string, amount: number) => Promise<void>;
  onFilterChange: (filter: string) => void;
  getFilteredExpenses: (filter: string) => any[];
  // Props for RecentTransactions pagination
  recentTransactionsCurrentPage: number;
  recentTransactionsItemsPerPage: number;
  onRecentTransactionsPageChange: (page: number) => void;
  // New props for RecentTransactions filters
  recentTransactionsCategoryFilter: string;
  recentTransactionsDescriptionFilter: string;
  onRecentTransactionsFilterChange: (filters: { categoryId?: string; description?: string }) => void;
}

export function renderDashboardLayout(props: DashboardLayoutProps) {
  const appDiv = document.querySelector<HTMLDivElement>('#app')!;
  appDiv.innerHTML = `
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
          <div id="expense-form-container"></div>
          <div id="recent-transactions-container"></div>
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
            <div id="budget-summary-container"></div>
            <div id="budget-goals-container"></div>
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
          <div id="analytics-controls-container"></div>
          <div id="financial-metrics-container"></div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-background p-6 rounded-lg border border-border h-80 flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]" id="bar-chart-container"></div>
            <div class="bg-background p-6 rounded-lg border border-border h-80 flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]" id="line-chart-container"></div>
            <div class="lg:col-span-2 bg-background p-6 rounded-lg border border-border h-80 flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]" id="pie-chart-container"></div>
          </div>
        </section>
      </main>
    </div>
  `;

  const signOutBtn = appDiv.querySelector('#sign-out-btn') as HTMLButtonElement;
  signOutBtn.addEventListener('click', props.onSignOut);

  // Render sub-components
  const expenseFormContainer = appDiv.querySelector('#expense-form-container') as HTMLElement;
  renderExpenseForm(expenseFormContainer, {
    categories: props.categories,
    onAddExpense: props.onAddExpense,
    onAddCustomCategory: props.onAddCustomCategory,
  });

  const recentTransactionsContainer = appDiv.querySelector('#recent-transactions-container') as HTMLElement;
  renderRecentTransactions(recentTransactionsContainer, {
    expenses: props.expenses,
    categories: props.categories, // Pass categories for filter dropdown
    currentPage: props.recentTransactionsCurrentPage,
    itemsPerPage: props.recentTransactionsItemsPerPage,
    totalItems: props.expenses.length, // This will be the total *unfiltered* expenses for pagination calculation
    categoryFilter: props.recentTransactionsCategoryFilter,
    descriptionFilter: props.recentTransactionsDescriptionFilter,
    onPageChange: props.onRecentTransactionsPageChange,
    onFilterChange: props.onRecentTransactionsFilterChange,
  });

  // Calculate budget summary metrics
  const totalBudgetedAmount = props.budgets.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
  const filteredExpensesForMetrics = props.getFilteredExpenses(props.currentFilter);
  const totalSpentAmount = filteredExpensesForMetrics
    .filter(exp => exp.categories.name !== 'Income')
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const remainingOverall = totalBudgetedAmount - totalSpentAmount;
  const percentageRemaining = totalBudgetedAmount > 0 ? (remainingOverall / totalBudgetedAmount) * 100 : 0;

  const budgetSummaryContainer = appDiv.querySelector('#budget-summary-container') as HTMLElement;
  renderBudgetSummary(budgetSummaryContainer, {
    totalBudgetedAmount,
    totalSpentAmount,
    remainingOverall,
    percentageRemaining,
  });

  const budgetGoalsContainer = appDiv.querySelector('#budget-goals-container') as HTMLElement;
  renderBudgetGoals(budgetGoalsContainer, {
    categories: props.categories,
    budgets: props.budgets,
    expenses: props.expenses,
    onSetEditBudgets: () => {
      renderBudgetModal({
        categories: props.categories,
        budgets: props.budgets,
        onSaveBudgets: async (newBudgets) => {
          for (const budget of newBudgets) {
            await props.onSetBudget(budget.categoryId, budget.amount);
          }
        },
        onClose: hideBudgetModal,
      });
      showBudgetModal();
    },
  });

  const analyticsControlsContainer = appDiv.querySelector('#analytics-controls-container') as HTMLElement;
  renderAnalyticsControls(analyticsControlsContainer, {
    currentFilter: props.currentFilter,
    onFilterChange: props.onFilterChange,
  });

  const financialMetricsContainer = appDiv.querySelector('#financial-metrics-container') as HTMLElement;
  renderFinancialMetrics(financialMetricsContainer, {
    totalSpending: totalSpentAmount,
    remainingBudget: remainingOverall,
    status: remainingOverall >= 0 ? 'Under Budget' : 'Over Budget',
  });

  const barChartContainer = appDiv.querySelector('#bar-chart-container') as HTMLElement;
  renderBarChart(barChartContainer, {
    expenses: filteredExpensesForMetrics,
    currentFilter: props.currentFilter,
    chartColors: props.chartColors,
  });

  const lineChartContainer = appDiv.querySelector('#line-chart-container') as HTMLElement;
  renderLineChart(lineChartContainer, {
    expenses: filteredExpensesForMetrics,
    currentFilter: props.currentFilter,
    chartColors: props.chartColors,
  });

  const pieChartContainer = appDiv.querySelector('#pie-chart-container') as HTMLElement;
  renderPieChart(pieChartContainer, {
    expenses: filteredExpensesForMetrics,
    currentFilter: props.currentFilter,
    chartColors: props.chartColors,
  });
}
