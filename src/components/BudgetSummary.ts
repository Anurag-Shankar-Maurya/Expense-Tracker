interface BudgetSummaryProps {
  totalBudgetedAmount: number;
  totalSpentAmount: number;
  remainingOverall: number;
  percentageRemaining: number;
}

export function renderBudgetSummary(container: HTMLElement, props: BudgetSummaryProps) {
  container.innerHTML = `
    <div class="bg-background p-5 rounded-lg border border-border">
      <h3 class="text-xl font-semibold text-text mb-3">Monthly Overview</h3>
      <div class="flex justify-between items-center mb-2">
        <span class="text-textSecondary">Total Budget:</span>
        <span id="total-budget" class="text-lg font-bold text-primary">$${props.totalBudgetedAmount.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-center mb-2">
        <span class="text-textSecondary">Total Spent:</span>
        <span id="total-spent" class="text-lg font-bold text-error">-$${props.totalSpentAmount.toFixed(2)}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-textSecondary">Remaining:</span>
        <span id="remaining-budget" class="text-lg font-bold ${props.remainingOverall < 0 ? 'text-error' : 'text-success'}">$${props.remainingOverall.toFixed(2)}</span>
      </div>
      <div class="w-full bg-border rounded-full h-3 mt-4">
        <div id="budget-progress-bar" class="h-3 rounded-full ${props.percentageRemaining < 20 ? 'bg-error' : props.percentageRemaining < 50 ? 'bg-warning' : 'bg-success'}" style="width: ${Math.max(0, Math.min(100, props.percentageRemaining))}%;"></div>
      </div>
      <p id="budget-percentage-text" class="text-sm text-textSecondary mt-2 text-right">${Math.max(0, props.percentageRemaining).toFixed(0)}% of budget remaining</p>
    </div>
  `;
}
