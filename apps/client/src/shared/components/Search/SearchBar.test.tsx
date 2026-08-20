import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

/**
 * COMPONENT SPEC (TDD) for SearchBar — restaurant-browsing feature.
 *
 * STATUS: SearchBar does not exist yet. This file is an executable specification
 * / NEEDS_CHANGES handoff for the frontend-builder agent. It will fail with
 * "Cannot find module './SearchBar'" until the component is created at:
 *
 *   apps/client/src/shared/components/Search/SearchBar.tsx
 *
 * Required props (typed, exported as `SearchBarProps`):
 *   onSearch: (query: string) => void;   // called (debounced) as the user types
 *   onNearMe?: () => void;               // "Use my location" / near-me action
 *   defaultValue?: string;
 *   placeholder?: string;
 *   loading?: boolean;                   // shows busy state on the searchbox
 *   debounceMs?: number;                 // default 300
 *
 * Required contract:
 *   - Renders an accessible search input (role="searchbox" with an accessible name).
 *   - data-testid: "search-bar" (root), "search-input", "near-me-button".
 *   - Typing debounces and calls onSearch with the current query.
 *   - Pressing Enter calls onSearch immediately with the current query.
 *   - The near-me button calls onNearMe.
 *   - When loading, the searchbox is marked busy (aria-busy="true").
 *   - No axe accessibility violations; input has an associated label.
 */
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('renders an accessible searchbox and a near-me button', () => {
    render(<SearchBar onSearch={jest.fn()} onNearMe={jest.fn()} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByTestId('near-me-button')).toBeInTheDocument();
  });

  it('debounces typing and calls onSearch with the query', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} debounceMs={300} />);

    await user.type(screen.getByRole('searchbox'), 'sushi');
    // Not called until the debounce window elapses.
    expect(onSearch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(onSearch).toHaveBeenCalledWith('sushi');

    jest.useRealTimers();
  });

  it('submits immediately on Enter', async () => {
    const user = userEvent.setup();
    const onSearch = jest.fn();
    render(<SearchBar onSearch={onSearch} />);
    await user.type(screen.getByRole('searchbox'), 'burger{enter}');
    expect(onSearch).toHaveBeenCalledWith('burger');
  });

  it('invokes onNearMe when the near-me button is pressed', async () => {
    const user = userEvent.setup();
    const onNearMe = jest.fn();
    render(<SearchBar onSearch={jest.fn()} onNearMe={onNearMe} />);
    await user.click(screen.getByTestId('near-me-button'));
    expect(onNearMe).toHaveBeenCalledTimes(1);
  });

  it('marks the searchbox busy while loading', () => {
    render(<SearchBar onSearch={jest.fn()} loading />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-busy', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <SearchBar onSearch={jest.fn()} onNearMe={jest.fn()} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
