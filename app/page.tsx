import Link from "next/link";

export default async function HomePage() {
  return (
    <section className="card stack">
      <h1>Honest family talks, delivered later.</h1>
      <p className="muted">
        GlassBottle lets you write emotionally heavy messages when you are ready, then delivers them at a random
        time between 5 and 72 hours later.
      </p>
      <div className="actions">
        <Link href="/auth">
          <button type="button">Start with email login</button>
        </Link>
      </div>
    </section>
  );
}
