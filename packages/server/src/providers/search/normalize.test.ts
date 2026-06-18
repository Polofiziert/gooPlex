import { describe, expect, it } from "vitest";
import { classifySourceType, normalizeUrl } from "./normalize.js";

describe("normalizeUrl", () => {
  it("strips protocol, www, trailing slash, and tracking params", () => {
    expect(
      normalizeUrl("https://www.example.com/path/?utm_source=x&id=1"),
    ).toBe("example.com/path?id=1");
    expect(normalizeUrl("http://Example.com/path/")).toBe("example.com/path");
  });
});

describe("classifySourceType", () => {
  const cases: Array<{ url: string; expected: ReturnType<typeof classifySourceType> }> = [
    // 1. .edu / .ac.<cc>
    { url: "https://cs.stanford.edu/course", expected: "academic" },
    { url: "https://www.cam.ac.uk/research", expected: "academic" },
    // 2. arxiv / biorxiv / ssrn / pubmed / ncbi
    { url: "https://arxiv.org/abs/1234", expected: "academic" },
    { url: "https://pubmed.ncbi.nlm.nih.gov/1", expected: "academic" },
    // 3. doi.org / publishers
    { url: "https://doi.org/10.1234/example", expected: "academic" },
    { url: "https://www.nature.com/articles/nature12345", expected: "academic" },
    // 4. developer.* / docs.* / readthedocs / devdocs
    { url: "https://developer.mozilla.org/en-US/docs/Web", expected: "docs" },
    { url: "https://docs.python.org/3/", expected: "docs" },
    { url: "https://project.readthedocs.io/en/latest/", expected: "docs" },
    { url: "https://devdocs.io/python/", expected: "docs" },
    // 5. path segments
    { url: "https://example.com/documentation/start", expected: "docs" },
    { url: "https://example.com/api/v1/users", expected: "docs" },
    // 6. github.io / language docs hosts
    { url: "https://reactjs.github.io/react/docs", expected: "docs" },
    { url: "https://pkg.go.dev/fmt", expected: "docs" },
    { url: "https://www.rust-lang.org/learn", expected: "docs" },
    // 7. forum hosts
    { url: "https://www.reddit.com/r/programming", expected: "forum" },
    { url: "https://stackoverflow.com/questions/1", expected: "forum" },
    { url: "https://news.ycombinator.com/item?id=1", expected: "forum" },
    { url: "https://community.example.com/t/1", expected: "forum" },
    // 8. github.com issues vs repo
    { url: "https://github.com/org/repo/issues/1", expected: "forum" },
    { url: "https://github.com/org/repo/discussions/1", expected: "forum" },
    { url: "https://github.com/org/repo", expected: "docs" },
    // 9. news
    { url: "https://www.nytimes.com/2024/01/01/world", expected: "news" },
    { url: "https://www.bbc.co.uk/news/world", expected: "news" },
    // 10–11. default other (blogs)
    { url: "https://medium.com/@user/post", expected: "other" },
    { url: "https://example.substack.com/p/hello", expected: "other" },
    { url: "https://myblog.wordpress.com/2024/01/01", expected: "other" },
    { url: "https://random-blog.blogspot.com/post", expected: "other" },
    { url: "https://unknown-site.example/article", expected: "other" },
  ];

  it.each(cases)("classifies $url as $expected", ({ url, expected }) => {
    expect(classifySourceType(url)).toBe(expected);
  });
});
