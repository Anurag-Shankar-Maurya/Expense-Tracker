interface CategorySelectProps {
  id: string;
  categories: any[];
  selectedValue?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

export function renderCategorySelect(props: CategorySelectProps): HTMLSelectElement {
  const selectElement = document.createElement('select');
  selectElement.id = props.id;
  selectElement.className = 'flex-grow p-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 text-text';
  if (props.required) {
    selectElement.required = true;
  }

  selectElement.innerHTML = '<option value="">Select Category</option>'; // Clear existing options
  props.categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    if (props.selectedValue === category.id) {
      option.selected = true;
    }
    selectElement.appendChild(option);
  });

  if (props.onChange) {
    selectElement.addEventListener('change', (e) => props.onChange!((e.target as HTMLSelectElement).value));
  }

  return selectElement;
}
