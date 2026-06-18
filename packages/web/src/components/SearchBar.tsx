import { useNavigate } from "@solidjs/router";
import type { Component } from "solid-js";
import { createSignal } from "solid-js";

export interface SearchBarProps {
  initialQuery?: string;
  autofocus?: boolean;
}

const SearchBar: Component<SearchBarProps> = (props) => {
  const navigate = useNavigate();
  const [query, setQuery] = createSignal(props.initialQuery ?? "");

  const submit = (event: Event) => {
    event.preventDefault();
    const q = query().trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form class="w-full max-w-2xl" onSubmit={submit}>
      <input
        class="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 text-lg text-neutral-100 outline-none focus:border-teal-500"
        type="search"
        name="q"
        placeholder="Search the web..."
        value={query()}
        onInput={(event) => setQuery(event.currentTarget.value)}
        autofocus={props.autofocus ?? false}
        aria-label="Search query"
      />
    </form>
  );
};

export default SearchBar;
