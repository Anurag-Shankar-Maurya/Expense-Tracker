import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface LineChartProps {
  expenses: any[];
  currentFilter: string;
  chartColors: string[];
}

let lineChart: Chart | null = null;

export function renderLineChart(container: HTMLElement, props: LineChartProps) {
  container.innerHTML = '<canvas id="line-chart-canvas"></canvas>';
  const ctx = container.querySelector('#line-chart-canvas') as HTMLCanvasElement;
  if (!ctx) return;

  if (lineChart) {
    lineChart.destroy();
  }

  const filteredExpenses = props.expenses.filter(exp => exp.categories.name !== 'Income');
  const labels: string[] = [];
  const data: number[] = [];

  const now = new Date();

  if (props.currentFilter === 'Last 6 Months' || props.currentFilter === 'This Year' || props.currentFilter === 'Last Month') {
    // Group by month for longer periods
    const monthMap: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
      const expenseDate = new Date(exp.date);
      const monthYearKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      monthMap[monthYearKey] = (monthMap[monthYearKey] || 0) + parseFloat(exp.amount);
    });

    // Generate labels and data for the selected period
    let tempDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (props.currentFilter === 'Last Month') {
      tempDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    } else if (props.currentFilter === 'Last 6 Months') {
      tempDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else if (props.currentFilter === 'This Year') {
      tempDate = new Date(now.getFullYear(), 0, 1);
    }

    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month
    if (props.currentFilter === 'Last Month') {
      endDate.setDate(0); // End of last month
    } else if (props.currentFilter === 'This Year') {
      endDate.setMonth(11); // End of December
      endDate.setDate(31);
    }

    while (tempDate <= endDate) {
      const label = tempDate.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthYearKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}`;
      labels.push(label);
      data.push(monthMap[monthYearKey] || 0);
      tempDate.setMonth(tempDate.getMonth() + 1);
    }

  } else {
    // Group by day for shorter periods (Today, Last 7 Days, This Month)
    const dayMap: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
      const expenseDate = new Date(exp.date);
      const dayKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}-${String(expenseDate.getDate()).padStart(2, '0')}`;
      dayMap[dayKey] = (dayMap[dayKey] || 0) + parseFloat(exp.amount);
    });

    let tempDate: Date;
    let loopEndDate: Date;

    if (props.currentFilter === 'Today') {
      tempDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      loopEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (props.currentFilter === 'Last 7 Days') {
      tempDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      loopEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else { // This Month
      tempDate = new Date(now.getFullYear(), now.getMonth(), 1);
      loopEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of this month
    }

    while (tempDate <= loopEndDate) {
      const label = tempDate.toLocaleString('default', { day: 'numeric', month: 'short' });
      const dayKey = `${tempDate.getFullYear()}-${String(tempDate.getMonth() + 1).padStart(2, '0')}-${String(tempDate.getDate()).padStart(2, '0')}`;
      labels.push(label);
      data.push(dayMap[dayKey] || 0);
      tempDate.setDate(tempDate.getDate() + 1);
    }
  }

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Total Spending',
        data: data,
        borderColor: props.chartColors[0], // primary color
        backgroundColor: props.chartColors[0] + '40', // primary color with transparency
        fill: true,
        tension: 0.3,
        pointBackgroundColor: props.chartColors[0],
        pointBorderColor: '#FFFFFF',
        pointHoverBackgroundColor: '#FFFFFF',
        pointHoverBorderColor: props.chartColors[0],
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Spending Trends (${props.currentFilter})`,
          color: '#FFFFFF',
          font: {
            size: 16
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#A3A3A3'
          },
          grid: {
            color: '#2F2F2F'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: '#A3A3A3',
            callback: function(value) {
              return '$' + (value as number).toFixed(2);
            }
          },
          grid: {
            color: '#2F2F2F'
          }
        }
      }
    }
  });
}
