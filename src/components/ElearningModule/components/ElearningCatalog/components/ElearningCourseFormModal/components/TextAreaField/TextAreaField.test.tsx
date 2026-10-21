import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TextAreaField } from './TextAreaField';

describe('TextAreaField', () => {
  it('labels a required text area', async () => {
    const onChange = vi.fn();
    render(<TextAreaField id="t" label="Description" value="" required onChange={onChange} />);
    const field = screen.getByRole('textbox', { name: /Description/ });
    expect(field).toBeRequired(); await userEvent.type(field, 'A'); expect(onChange).toHaveBeenCalledWith('A');
  });
});
