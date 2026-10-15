export default function Loading() {
  return <section aria-busy="true" aria-label="Formation" className="space-y-5 p-6">
    <h1 className="text-2xl font-semibold">Formation</h1>
    <p role="status">Chargement des formations…</p>
    <div aria-hidden="true" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map(item => <div key={item} className="h-64 animate-pulse rounded-2xl bg-muted motion-reduce:animate-none" />)}
    </div>
  </section>;
}
