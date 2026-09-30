export const metadata = { title: "Unlock · Sparring Partner" };

export default async function UnlockPage({ searchParams }: { searchParams: Promise<{ wrong?: string }> }) {
  const { wrong } = await searchParams;
  return (
    <main className="page narrow">
      <div className="hero">
        <div className="alien" aria-hidden>👽</div>
        <h1>Sparring Partner</h1>
        <p className="muted">Enter your access code to continue.</p>
      </div>
      <form method="post" action="/api/unlock" className="card stack">
        <label className="field">
          <span>Access code</span>
          <input name="code" type="password" autoComplete="current-password" required autoFocus />
        </label>
        {wrong && <p className="error">That code didn&apos;t match.</p>}
        <button className="btn primary" type="submit">Unlock</button>
      </form>
    </main>
  );
}
