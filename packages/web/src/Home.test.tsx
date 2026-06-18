import { render } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import { describe, expect, it } from "vitest";
import Home from "./routes/Home.js";

describe("Home", () => {
  it("renders an autofocus search bar", () => {
    const { container } = render(() => (
      <Router>
        <Route path="*" component={Home} />
      </Router>
    ));
    const input = container.querySelector('input[type="search"]');
    expect(input).not.toBeNull();
    expect(input?.hasAttribute("autofocus")).toBe(true);
  });
});
