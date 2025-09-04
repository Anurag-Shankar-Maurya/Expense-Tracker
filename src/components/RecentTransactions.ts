interface RecentTransactionsProps {
  expenses: any[];
  categories: any[];
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  categoryFilter: string;
  descriptionFilter: string;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { categoryId?: string; description?: string }) => void;
}

export function renderRecentTransactions(container: HTMLElement, props: RecentTransactionsProps) {
  // Apply filters first
  let filteredExpenses = props.expenses;

  if (props.categoryFilter && props.categoryFilter !== 'all') {
    filteredExpenses = filteredExpenses.filter(exp => exp.categories.id === props.categoryFilter);
  }

  if (props.descriptionFilter) {
    const searchTerm = props.descriptionFilter.toLowerCase();
    filteredExpenses = filteredExpenses.filter(exp =>
      exp.description && exp.description.toLowerCase().includes(searchTerm)
    );
  }

  const totalFilteredItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalFilteredItems / props.itemsPerPage);
  const startIndex = (props.currentPage - 1) * props.itemsPerPage;
  const endIndex = startIndex + props.itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  container.innerHTML = `
    <div>
      <h3 class="text-xl font-semibold text-text mb-4">Recent Transactions</h3>
      <div class="flex flex-col sm:flex-row gap-4 mb-4">
        <div class="flex-1">
          <label for="category-filter" class="block text-textSecondary text-sm font-medium mb-1">Filter by Category</label>
          <select id="category-filter" class="w-full p-2 bg-surface border border-border rounded-lg text-text focus:ring-primary focus:border-primary transition-all duration-200">
            <option value="all">All Categories</option>
            ${props.categories.map(cat => `
              <option value="${cat.id}" ${props.categoryFilter === cat.id ? 'selected' : ''}>${cat.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="flex-1">
          <label for="description-filter" class="block text-textSecondary text-sm font-medium mb-1">Search Description</label>
          <div class="relative w-full">
            <input type="text" id="description-filter" placeholder="e.g., Groceries, Rent" value="${props.descriptionFilter}"
                   class="w-full p-2 bg-surface border border-border rounded-lg text-text placeholder-textSecondary focus:ring-primary focus:border-primary transition-all duration-200" />
            <button id="description-filter-button" class="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white rounded-md p-1.5 hover:bg-primary/80 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div class="overflow-x-auto bg-background rounded-lg border border-border">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-surface border-b border-border">
            <tr>
              <th scope="col" class="px-6 py-3 text-textSecondary font-semibold">Category</th>
              <th scope="col" class="px-6 py-3 text-textSecondary font-semibold">Amount</th>
              <th scope="col" class="px-6 py-3 text-textSecondary font-semibold">Date</th>
              <th scope="col" class="px-6 py-3 text-textSecondary font-semibold">Description</th>
            </tr>
          </thead>
          <tbody id="transactions-list">
            <!-- Transactions will be loaded here -->
          </tbody>
        </table>
        <p id="no-transactions-message" class="p-6 text-center text-textSecondary hidden">No transactions yet. Add your first expense!</p>
        <p id="no-filtered-transactions-message" class="p-6 text-center text-textSecondary hidden">No transactions match your current filters.</p>
      </div>
      <div id="pagination-controls" class="flex justify-center items-center mt-4 space-x-2">
        <button id="prev-page-btn" class="px-4 py-2 bg-surface text-text rounded-lg hover:bg-primary/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Previous</button>
        <span id="page-info" class="text-textSecondary text-sm">Page ${props.currentPage} of ${totalPages}</span>
        <button id="next-page-btn" class="px-4 py-2 bg-surface text-text rounded-lg hover:bg-primary/20 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm">Next</button>
      </div>
    </div>
  `;

  const transactionsList = container.querySelector('#transactions-list') as HTMLTableSectionElement;
  const noTransactionsMessage = container.querySelector('#no-transactions-message') as HTMLParagraphElement;
  const noFilteredTransactionsMessage = container.querySelector('#no-filtered-transactions-message') as HTMLParagraphElement;
  const prevPageBtn = container.querySelector('#prev-page-btn') as HTMLButtonElement;
  const nextPageBtn = container.querySelector('#next-page-btn') as HTMLButtonElement;
  const categoryFilterSelect = container.querySelector('#category-filter') as HTMLSelectElement;
  const descriptionFilterInput = container.querySelector('#description-filter') as HTMLInputElement;
  const descriptionFilterButton = container.querySelector('#description-filter-button') as HTMLButtonElement;

  if (!transactionsList || !noTransactionsMessage || !noFilteredTransactionsMessage || !prevPageBtn || !nextPageBtn || !categoryFilterSelect || !descriptionFilterInput || !descriptionFilterButton) return;

  transactionsList.innerHTML = ''; // Clear existing transactions

  if (props.expenses.length === 0) {
    noTransactionsMessage.classList.remove('hidden');
    noFilteredTransactionsMessage.classList.add('hidden');
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  } else {
    noTransactionsMessage.classList.add('hidden');
  }

  if (paginatedExpenses.length === 0) {
    noFilteredTransactionsMessage.classList.remove('hidden');
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    return;
  } else {
    noFilteredTransactionsMessage.classList.add('hidden');
  }

  paginatedExpenses.forEach(expense => {
    const row = document.createElement('tr');
    row.className = 'border-b border-border hover:bg-surface/50 transition-colors';
    const amountClass = expense.categories.name === 'Income' ? 'text-success' : 'text-error';
    const formattedAmount = expense.categories.name === 'Income' ? `+$${parseFloat(expense.amount).toFixed(2)}` : `-$${parseFloat(expense.amount).toFixed(2)}`;

    row.innerHTML = `
      <td class="px-6 py-4 font-medium text-primary">${expense.categories.name}</td>
      <td class="px-6 py-4 ${amountClass}">${formattedAmount}</td>
      <td class="px-6 py-4 text-textSecondary">${expense.date}</td>
      <td class="px-6 py-4 text-textSecondary">${expense.description || '-'}</td>
    `;
    transactionsList.appendChild(row);
  });

  // Pagination logic
  prevPageBtn.disabled = props.currentPage === 1;
  nextPageBtn.disabled = props.currentPage === totalPages;

  prevPageBtn.addEventListener('click', () => {
    if (props.currentPage > 1) {
      props.onPageChange(props.currentPage - 1);
    }
  });

  nextPageBtn.addEventListener('click', () => {
    if (props.currentPage < totalPages) {
      props.onPageChange(props.currentPage + 1);
    }
  });

  categoryFilterSelect.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    props.onFilterChange({ categoryId: target.value });
  });

  // Filter when the description filter button is clicked
  descriptionFilterButton.addEventListener('click', () => {
    props.onFilterChange({ description: descriptionFilterInput.value });
  });
}
