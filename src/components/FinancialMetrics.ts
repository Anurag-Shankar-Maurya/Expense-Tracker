interface FinancialMetricsProps {
  totalSpending: number;
  remainingBudget: number;
  status: 'Under Budget' | 'Over Budget';
}

export function renderFinancialMetrics(container: HTMLElement, props: FinancialMetricsProps) {
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-background p-5 rounded-lg border border-border flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-105">
        <p class="text-textSecondary text-sm mb-1">Total Spending</p>
        <p id="analytics-total-spending" class="text-3xl font-bold text-error">-$${props.totalSpending.toFixed(2)}</p>
      </div>
      <div class="bg-background p-5 rounded-lg border border-border flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-105">
        <p class="text-textSecondary text-sm mb-1">Remaining Budget</p>
        <p id="analytics-remaining-budget" class="text-3xl font-bold ${props.remainingBudget < 0 ? 'text-error' : 'text-success'}">$${props.remainingBudget.toFixed(2)}</p>
      </div>
      <div class="bg-background p-5 rounded-lg border border-border flex flex-col items-center justify-center text-center transition-transform duration-300 hover:scale-105">
        <p class="text-textSecondary text-sm mb-1">Status</p>
        <p id="analytics-status" class="text-3xl font-bold ${props.status === 'Under Budget' ? 'text-success' : 'text-error'}">${props.status}</p>
      </div>
    </div>
  `;
}
