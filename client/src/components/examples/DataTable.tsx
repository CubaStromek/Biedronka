import DataTable, { ProductData } from '../DataTable';

const mockData: ProductData[] = [
  {
    id: '1',
    name: 'Wireless Mouse',
    totalPrice: 2495.00,
    category: 'Electronics',
  },
  {
    id: '2',
    name: 'USB-C Cable',
    totalPrice: 1990.00,
    category: 'Accessories',
  },
  {
    id: '3',
    name: 'Mechanical Keyboard',
    totalPrice: 4998.00,
    category: 'Electronics',
  },
  {
    id: '4',
    name: 'Laptop Stand',
    totalPrice: 2697.00,
    category: 'Accessories',
  },
  {
    id: '5',
    name: 'Webcam HD',
    totalPrice: 1299.00,
    category: 'Electronics',
  },
];

export default function DataTableExample() {
  return <DataTable data={mockData} />;
}
