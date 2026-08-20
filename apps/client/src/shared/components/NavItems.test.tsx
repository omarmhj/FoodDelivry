import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import NavItems from './NavItems';

/**
 * Harness smoke test.
 * Purpose: prove the Jest + React Testing Library + jest-dom + jest-axe wiring
 * is correct against a component that ALREADY EXISTS in the app. If this fails,
 * the problem is the test setup, not the feature under test.
 */
describe('NavItems (harness smoke test)', () => {
  it('renders all primary navigation links', () => {
    render(<NavItems />);
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /restaurants/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /popular foods/i })
    ).toBeInTheDocument();
  });

  it('points the Restaurants link at the /restaurants browsing route', () => {
    render(<NavItems />);
    expect(screen.getByRole('link', { name: /restaurants/i })).toHaveAttribute(
      'href',
      '/restaurants'
    );
  });

  it('highlights the active item passed via props', () => {
    render(<NavItems activeItem={2} />);
    // 3rd item (index 2) is "Restaurants"
    expect(screen.getByRole('link', { name: /restaurants/i })).toHaveClass(
      'text-[#37b668]'
    );
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = render(<NavItems />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
