import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the railway management heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /railway management system/i })).toBeInTheDocument();
});
