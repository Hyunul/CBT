import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import QuestionText from "@/components/QuestionText";
import { apiUrl } from "@/lib/api-url";

afterEach(cleanup);

it("renders image tokens with encoded API URLs and preserves surrounding text", () => {
  const { container } = render(
    <QuestionText text={"첫째 줄\n  [이미지: 도표#1.png ]\n둘째 [이미지:chart.png] 끝"} />,
  );
  const images = screen.getAllByRole("img", { name: "문제 이미지" });
  expect(images.map((img) => img.getAttribute("src"))).toEqual([
    apiUrl("/api/question-images/" + encodeURIComponent("도표#1.png")),
    apiUrl("/api/question-images/chart.png"),
  ]);
  expect(container.textContent).toBe("첫째 줄\n  \n둘째  끝");
  for (const img of images) {
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.className).toBe("max-w-full h-auto");
  }
});

it("keeps ordinary text, newlines, spaces, and unmatched tokens unchanged", () => {
  const text = "첫째 줄\n  둘째 줄\n[이미지: ] [이미지: file name.png]";
  const { container } = render(<QuestionText text={text} />);
  expect(container.textContent).toBe(text);
  expect(container.firstElementChild?.className).toContain("whitespace-pre-wrap");
  expect(screen.queryByRole("img")).toBeNull();
});

it("uses HTTP and HTTPS image URLs unchanged", () => {
  const urls = ["http://example.com/chart.png", "https://example.com/chart.png?size=2&v=1"];
  render(<QuestionText text={urls.map((url) => `[이미지: ${url}]`).join("\n")} />);
  expect(screen.getAllByRole("img").map((img) => img.getAttribute("src"))).toEqual(urls);
});

it("renders plain and language code fences while processing image tokens only outside code", () => {
  const { container } = render(<QuestionText text={'앞 [이미지: before.png]\n```js\n  const text = "[이미지: inside.png]";\n```\n중간\n```\n<x> & y\n```\n뒤 [이미지: after.png]'} />);
  const blocks = container.querySelectorAll("pre > code");
  expect(blocks).toHaveLength(2);
  expect(blocks[0].textContent).toBe('  const text = "[이미지: inside.png]";\n');
  expect(blocks[1].textContent).toBe("<x> & y\n");
  expect(blocks[0].querySelector("img")).toBeNull();
  expect(screen.getAllByRole("img").map((img) => img.getAttribute("src"))).toEqual([
    apiUrl("/api/question-images/before.png"), apiUrl("/api/question-images/after.png"),
  ]);
  expect(container.textContent).toContain("중간");
  expect(container.textContent).not.toContain("```");
  expect(blocks[0].parentElement?.className).toContain("overflow-x-auto whitespace-pre text-sm");
});

it("treats everything after an unclosed fence as code, including image tokens and language fences", () => {
  const code = "[이미지: inside.png]\n```python\nprint('hello')";
  const { container } = render(<QuestionText text={`본문\n\`\`\`\n${code}`} />);
  expect(container.querySelector("pre > code")?.textContent).toBe(code);
  expect(screen.queryByRole("img")).toBeNull();
});

it("supports CRLF fences and keeps inline backticks as ordinary text", () => {
  const { container } = render(<QuestionText text={"inline ```text```\r\n```sql\r\nSELECT 1;\r\n```\r\n끝"} />);
  // The HTML parser normalizes CRLF inside highlighted HTML to LF.
  expect(container.querySelector("code")?.textContent).toBe("SELECT 1;\n");
  expect(container.textContent).toBe("inline ```text```\r\nSELECT 1;\n끝");
});

it.each([
  ["c", 'int main(void) { return 42; }\n'],
  ["java", 'public class Example { String value = "hello"; }\n'],
  ["python", 'def greet():\n    return "hello"\n'],
  ["sql", 'SELECT name FROM users WHERE id = 42;\n'],
  ["", 'def greet():\n    return "hello"\n'],
])("highlights a %s fence with token spans while preserving the code", (language, code) => {
  const { container } = render(<QuestionText text={`\`\`\`${language}\n${code}\`\`\``} />);
  const block = container.querySelector("pre > code");
  expect(block?.querySelector('span[class^="hljs-"]')).not.toBeNull();
  expect(block?.querySelector(".hljs-keyword")).not.toBeNull();
  expect(block?.textContent).toBe(code);
});

it.each(["java", "", "unsupported"])("escapes HTML and less-than signs inside a %s fence", (language) => {
  const code = 'if (a < 2) { String value = "<img src=x onerror=alert(1)>"; }\n';
  const { container } = render(<QuestionText text={`\`\`\`${language}\n${code}\`\`\``} />);
  const block = container.querySelector("pre > code");
  expect(block?.textContent).toBe(code);
  expect(block?.innerHTML).toContain("&lt;");
  expect(block?.querySelector("img")).toBeNull();
  expect(block?.querySelector("[onerror]")).toBeNull();
});
