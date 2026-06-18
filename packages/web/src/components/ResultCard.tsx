import type { RankedResult, RawResult } from "@gooplex/shared";
import type { Component } from "solid-js";

export interface ResultCardProps {
  result: RawResult | RankedResult;
  dimmed?: boolean;
}

const ResultCard: Component<ResultCardProps> = (props) => {
  const rank = "rank" in props.result ? props.result.rank : undefined;

  return (
    <article
      class="rounded-lg border border-neutral-800 bg-neutral-950 p-4"
      classList={{ "opacity-60": props.dimmed }}
      data-url={props.result.url}
    >
      <h2 class="text-base font-medium">
        <a
          class="text-teal-400 hover:underline"
          href={props.result.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {props.result.title || props.result.url}
        </a>
        {rank !== undefined ? (
          <span class="ml-2 text-xs text-neutral-500">#{rank}</span>
        ) : null}
      </h2>
      <p class="mt-1 text-sm text-neutral-400">{props.result.snippet}</p>
      <p class="mt-2 text-xs text-neutral-600">
        {props.result.engine} · {props.result.sourceType}
      </p>
    </article>
  );
};

export default ResultCard;
