"use client";
export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return <main className="state-page" role="alert"><h1>We could not load this page</h1><p>Please try again. Your bag is saved on this device.</p><button className="dark-button" onClick={reset}>Try again</button></main>;
}
