import type { SseEvent } from "@gooplex/shared";
import { Route, Router } from "@solidjs/router";
import type { Component } from "solid-js";
import Home from "./routes/Home.js";
import Search from "./routes/Search.js";

/** Ensures shared contract types are wired at compile time. */
const _sseContractCheck: SseEvent["event"] = "done";

void _sseContractCheck;

const App: Component = () => (
  <Router>
    <Route path="/" component={Home} />
    <Route path="/search" component={Search} />
  </Router>
);

export default App;
