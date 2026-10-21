export const LogoutErrorNotice = ({ message, onBackToLogin }: { message: string; onBackToLogin: () => void }) => (
  <section role="alert" className="mx-auto my-4 w-full max-w-[1130px] space-y-2 rounded border border-red-200 bg-white p-4 text-red-700">
    <p>{message}</p>
    <button type="button" className="rounded border px-4 py-2 text-sm font-medium" onClick={onBackToLogin}>Retour à la connexion</button>
  </section>
);
