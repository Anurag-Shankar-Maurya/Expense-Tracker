import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface PieChartProps {
  expenses: any[];
  currentFilter: string;
  chartColors: string[];
}

let pieChart: Chart | null = null;

export function renderPieChart(container: HTMLElement, props: PieChartProps) {
  container.innerHTML = '<canvas id="pie-chart-canvas"></canvas>';
  const ctx = container.querySelector('#pie-chart-canvas') as HTMLCanvasElement;
  if (!ctx) return;

  if (pieChart) {
    pieChart.destroy();
  }

  const filteredExpenses = props.expenses.filter(exp => exp.categories.name !== 'Income');

  const spendingByCategory: { [key: string]: number } = {};
  filteredExpenses.forEach(exp => {
    const categoryName = exp.categories.name;
    spendingByCategory[categoryName] = (spendingByCategory[categoryName] || 0) + parseFloat(exp.amount);
  });

  const labels = Object.keys(spendingByCategory);
  const data = Object.values(spendingByCategory);
  const colors = props.chartColors.slice(0, labels.length); // Use available colors

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
          text: `Spending Distribution by Category (${props.currentFilter})`,
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
