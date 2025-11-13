import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renderiza elementos principais da landing page', () => {
  render(<App />);

  const heroHeading = screen.getByRole('heading', {
    level: 1,
    name: /autonomia e bem-estar/i,
  });
  const primaryCta = screen.getByRole('button', { name: /começar agora/i });

  expect(heroHeading).toBeInTheDocument();
  expect(primaryCta).toBeInTheDocument();
});
