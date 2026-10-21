import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LogoutErrorNotice } from './LogoutErrorNotice';

describe('LogoutErrorNotice', () => {
  it('announces the failure and offers the return to Login', async () => {
    const onBackToLogin = vi.fn();
    render(<LogoutErrorNotice message="Déconnexion à vérifier" onBackToLogin={onBackToLogin} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Déconnexion à vérifier');
    await userEvent.click(screen.getByRole('button', { name: 'Retour à la connexion' })); expect(onBackToLogin).toHaveBeenCalledTimes(1);
  });
});
