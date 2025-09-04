interface BudgetGoalsProps {
  categories: any[];
  budgets: any[];
  expenses: any[]; // All expenses, will be filtered internally for current month
  onSetEditBudgets: () => void;
}

export function renderBudgetGoals(container: HTMLElement, props: BudgetGoalsProps) {
  container.innerHTML = `
    <div class="bg-background p-5 rounded-lg border border-border">
      <h3 class="text-xl font-semibold text-text mb-4">Category Goals</h3>
      <div id="category-budgets-list" class="space-y-4">
        <!-- Category budgets will be loaded here -->
      </div>
      <button id="set-edit-budgets-btn" class="mt-6 w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/80 transition-colors duration-300 text-sm font-medium">
        Set/Edit Budgets
      </button>
    </div>
  `;

  const categoryBudgetsList = container.querySelector('#category-budgets-list') as HTMLDivElement;
  const setEditBudgetsBtn = container.querySelector('#set-edit-budgets-btn') as HTMLButtonElement;

  if (!categoryBudgetsList || !setEditBudgetsBtn) return;

  categoryBudgetsList.innerHTML = ''; // Clear existing budgets

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthExpenses = props.expenses.filter(exp => {
    const expenseDate = new Date(exp.date);
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
  });

  props.categories.filter(cat => cat.name !== 'Income').forEach(category => {
    const budget = props.budgets.find(b => b.category_id === category.id);
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

  setEditBudgetsBtn.addEventListener('click', props.onSetEditBudgets);
}
