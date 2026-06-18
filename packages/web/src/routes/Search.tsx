import { useSearchParams } from "@solidjs/router";
import { createStore } from "solid-js/store";
import { createEffect, For, onCleanup, Show } from "solid-js";
import type { Component } from "solid-js";
import ResultCard from "../components/ResultCard.js";
import SearchBar from "../components/SearchBar.js";
import {
  applySearchEvent,
  createSearchStream,
  initialSearchState,
} from "../lib/api.js";

const Search: Component = () => {
  const [params] = useSearchParams();
  const [state, setState] = createStore(initialSearchState());

  createEffect(() => {
    const q = typeof params.q === "string" ? params.q.trim() : "";
    if (!q) {
      setState(initialSearchState());
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      setState({ ...initialSearchState(), stage: "searching" });

      try {
        const stream = await createSearchStream(q, { signal: controller.signal });

        for await (const event of stream) {
          if (cancelled) break;
          setState((prev) => applySearchEvent(prev, event));
        }
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        setState({
          stage: "error",
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    onCleanup(() => {
      cancelled = true;
      controller.abort();
    });
  });

  const query = () => (typeof params.q === "string" ? params.q : "");
  const showPartial = () =>
    state.stage !== "done" && state.partialResults.length > 0;
  const showResults = () => state.stage === "done" && state.results.length > 0;

  return (
    <main class="min-h-screen px-4 py-8">
      <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <SearchBar initialQuery={query()} />
        <Show when={state.errorMessage}>
          <p class="text-sm text-amber-400" role="alert">
            {state.errorMessage}
          </p>
        </Show>
        <Show when={showPartial()}>
          <section class="flex flex-col gap-3" aria-busy="true">
            <For each={state.partialResults}>
              {(result) => <ResultCard result={result} dimmed />}
            </For>
          </section>
        </Show>
        <Show when={showResults()}>
          <section class="flex flex-col gap-3">
            <For each={state.results}>
              {(result) => <ResultCard result={result} />}
            </For>
          </section>
        </Show>
        <Show when={state.stage === "done" && state.results.length === 0}>
          <p class="text-neutral-500">No results.</p>
        </Show>
      </div>
    </main>
  );
};

export default Search;
