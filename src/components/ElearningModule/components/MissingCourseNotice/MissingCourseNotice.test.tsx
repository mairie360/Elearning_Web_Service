import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MissingCourseNotice } from './MissingCourseNotice';

describe('MissingCourseNotice', () => {
  it('announces the missing course and returns to the catalogue', async () => {
    const onShowCatalog = vi.fn();
    render(<MissingCourseNotice onShowCatalog={onShowCatalog} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Cette formation n’est plus disponible');
    await userEvent.click(screen.getByRole('button', { name: 'Voir le catalogue' })); expect(onShowCatalog).toHaveBeenCalledTimes(1);
  });
});
