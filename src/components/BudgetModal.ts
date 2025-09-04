interface BudgetModalProps {
  categories: any[];
  budgets: any[];
  onSaveBudgets: (budgets: { categoryId: string; amount: number }[]) => Promise<void>;
  onClose: () => void;
}

export function renderBudgetModal(props: BudgetModalProps) {
  const appDiv = document.querySelector<HTMLDivElement>('#app')!;
  let modalContainer = appDiv.querySelector('#budget-modal') as HTMLDivElement;

  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'budget-modal';
    modalContainer.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 hidden transition-opacity duration-300 opacity-0';
    appDiv.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
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
  `;

  const budgetInputsContainer = modalContainer.querySelector('#budget-inputs-container') as HTMLDivElement;
  const budgetForm = modalContainer.querySelector('#budget-form') as HTMLFormElement;
  const cancelBudgetBtn = modalContainer.querySelector('#cancel-budget-btn') as HTMLButtonElement;

  budgetInputsContainer.innerHTML = ''; // Clear previous inputs

  props.categories.filter(cat => cat.name !== 'Income').forEach(category => {
    const existingBudget = props.budgets.find(b => b.category_id === category.id);
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

  budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const budgetInputs = budgetForm.querySelectorAll<HTMLInputElement>('#budget-inputs-container input[type="number"]');
    const newBudgets: { categoryId: string; amount: number }[] = [];

    for (const input of Array.from(budgetInputs)) {
      const categoryId = input.dataset.categoryId;
      const amount = parseFloat(input.value);

      if (categoryId && !isNaN(amount) && amount >= 0) {
        newBudgets.push({ categoryId, amount });
      } else {
        alert(`Invalid budget amount for category: ${input.previousElementSibling?.textContent}. Please enter a valid non-negative number.`);
        return; // Stop submission if any input is invalid
      }
    }
    await props.onSaveBudgets(newBudgets);
    props.onClose();
    alert('Budgets updated successfully!');
  });

  cancelBudgetBtn.addEventListener('click', props.onClose);
}

export function showBudgetModal() {
  const budgetModal = document.getElementById('budget-modal');
  if (!budgetModal) return;
  budgetModal.classList.remove('hidden', 'opacity-0');
  budgetModal.classList.add('flex', 'opacity-100');
  (budgetModal.children[0] as HTMLElement).classList.remove('scale-95');
  (budgetModal.children[0] as HTMLElement).classList.add('scale-100');
}

export function hideBudgetModal() {
  const budgetModal = document.getElementById('budget-modal');
  if (!budgetModal) return;
  budgetModal.classList.remove('flex', 'opacity-100');
  budgetModal.classList.add('hidden', 'opacity-0');
  (budgetModal.children[0] as HTMLElement).classList.remove('scale-100');
  (budgetModal.children[0] as HTMLElement).classList.add('scale-95');
}
