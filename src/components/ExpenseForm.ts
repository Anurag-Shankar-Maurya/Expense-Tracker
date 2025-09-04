import { renderCategorySelect } from './CategorySelect';

interface ExpenseFormProps {
  categories: any[];
  onAddExpense: (expenseData: { amount: number; date: string; description: string; category_id: string }) => Promise<void>;
  onAddCustomCategory: (categoryName: string) => Promise<void>;
}

export function renderExpenseForm(container: HTMLElement, props: ExpenseFormProps) {
  container.innerHTML = `
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
            <div id="category-select-wrapper" class="flex-grow"></div>
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
  `;

  const categorySelectWrapper = container.querySelector('#category-select-wrapper') as HTMLDivElement;
  const categorySelect = renderCategorySelect({
    id: 'expense-category',
    categories: props.categories,
    required: true,
  });
  categorySelectWrapper.appendChild(categorySelect);

  const addExpenseForm = container.querySelector('#add-expense-form') as HTMLFormElement;
  const addCustomCategoryBtn = container.querySelector('#add-custom-category-btn') as HTMLButtonElement;

  addExpenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amountInput = container.querySelector('#expense-amount') as HTMLInputElement;
    const dateInput = container.querySelector('#expense-date') as HTMLInputElement;
    const descriptionInput = container.querySelector('#expense-description') as HTMLInputElement;

    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;
    const description = descriptionInput.value;
    const category_id = categorySelect.value;

    if (!amount || !date || !category_id) {
      alert('Please fill in all required fields (Amount, Date, Category).');
      return;
    }

    await props.onAddExpense({ amount, date, description, category_id });

    // Clear form
    amountInput.value = '';
    dateInput.value = '';
    descriptionInput.value = '';
    categorySelect.value = '';
  });

  addCustomCategoryBtn.addEventListener('click', async () => {
    const newCategoryName = prompt('Enter new category name:');
    if (newCategoryName && newCategoryName.trim() !== '') {
      await props.onAddCustomCategory(newCategoryName.trim());
    }
  });
}
