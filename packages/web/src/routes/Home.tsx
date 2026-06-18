import type { Component } from "solid-js";
import SearchBar from "../components/SearchBar.js";

const Home: Component = () => {
  return (
    <main class="flex min-h-screen items-center justify-center px-4">
      <SearchBar autofocus />
    </main>
  );
};

export default Home;
