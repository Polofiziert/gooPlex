import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import Home from "./routes/Home.js";

describe("Home", () => {
  it("renders a blank home route", () => {
    const { container } = render(() => <Home />);
    expect(container.querySelector("main")).not.toBeNull();
  });
});
