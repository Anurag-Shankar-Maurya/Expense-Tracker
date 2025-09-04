import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface BarChartProps {
  expenses: any[];
  currentFilter: string;
  chartColors: string[];
}

let barChart: Chart | null = null;

export function renderBarChart(container: HTMLElement, props: BarChartProps) {
  container.innerHTML = '<canvas id="bar-chart-canvas"></canvas>';
  const ctx = container.querySelector('#bar-chart-canvas') as HTMLCanvasElement;
  if (!ctx) return;

  if (barChart) {
    barChart.destroy();
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
          text: `Spending by Category (${props.currentFilter})`,
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
