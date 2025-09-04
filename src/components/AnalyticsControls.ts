interface AnalyticsControlsProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
}

export function renderAnalyticsControls(container: HTMLElement, props: AnalyticsControlsProps) {
  container.innerHTML = `
    <div class="mb-8 flex flex-wrap gap-3 justify-center md:justify-start">
      <button id="filter-today" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm">Today</button>
      <button id="filter-last-7-days" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm">Last 7 Days</button>
      <button id="filter-this-month" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm">This Month</button>
      <button id="filter-last-month" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm">Last Month</button>
      <button id="filter-last-6-months" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm">Last 6 Months</button>
      <button id="filter-this-year" class="px-5 py-2 bg-background text-text rounded-lg hover:bg-primary/20 focus:bg-primary/30 transition-colors duration-200 text-sm">This Year</button>
    </div>
  `;

  const filterButtons = container.querySelectorAll<HTMLButtonElement>('button');

  const updateButtonStates = (activeFilter: string) => {
    filterButtons.forEach(button => {
      const buttonFilterText = button.textContent || '';
      if (buttonFilterText === activeFilter) {
        button.setAttribute('data-active', 'true');
        button.classList.add('bg-primary/30', 'text-white');
        button.classList.remove('bg-background');
      } else {
        button.setAttribute('data-active', 'false');
        button.classList.remove('bg-primary/30', 'text-white');
        button.classList.add('bg-background');
      }
    });
  };

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filterText = button.textContent || '';
      props.onFilterChange(filterText);
      updateButtonStates(filterText); // Update immediately on click
    });
  });

  // Initial state
  updateButtonStates(props.currentFilter);
}
