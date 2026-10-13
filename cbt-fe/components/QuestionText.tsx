import type { ReactNode } from "react";
import hljs from "highlight.js/lib/core";
import c from "highlight.js/lib/languages/c";
import java from "highlight.js/lib/languages/java";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import { apiUrl } from "@/lib/api-url";

hljs.registerLanguage("c", c);
hljs.registerLanguage("java", java);
hljs.registerLanguage("python", python);
hljs.registerLanguage("sql", sql);

interface QuestionTextProps {
  text: string;
  id?: string;
  className?: string;
}

export default function QuestionText({ text, id, className = "" }: QuestionTextProps) {
  const parts: ReactNode[] = [];
  const fence = /^```([^\r\n]*)(?:\r?\n|$)/gm;
  let textStart = 0;

  const renderText = (content: string, offset: number) => {
    const imageToken = /\[이미지:\s*([^\]\s]+)\s*\]/g;
    let lastIndex = 0;

    for (const match of content.matchAll(imageToken)) {
      parts.push(content.slice(lastIndex, match.index));
      const filename = match[1];
      const src = /^https?:\/\//i.test(filename)
        ? filename
        : apiUrl("/api/question-images/" + encodeURIComponent(filename));
      parts.push(
        // Dynamic question images use their original URL without Next image optimization.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`image-${offset + match.index}`} src={src} alt="문제 이미지" loading="lazy" className="max-w-full h-auto" />,
      );
      lastIndex = match.index + match[0].length;
    }
    parts.push(content.slice(lastIndex));
  };

  let opening: RegExpExecArray | null;
  while ((opening = fence.exec(text)) !== null) {
    renderText(text.slice(textStart, opening.index), textStart);
    const codeStart = fence.lastIndex;
    const closingFence = /^```\r?$/gm;
    closingFence.lastIndex = codeStart;
    const closing = closingFence.exec(text);
    const codeEnd = closing?.index ?? text.length;
    const code = text.slice(codeStart, codeEnd);
    const language = opening[1].trim().toLowerCase();
    // Unknown languages remain plain React text; only highlight.js output becomes HTML.
    const highlighted = language
      ? hljs.getLanguage(language)
        ? hljs.highlight(code, { language, ignoreIllegals: true }).value
        : null
      : hljs.highlightAuto(code, ["c", "java", "python", "sql"]).value;
    parts.push(
      <pre key={`code-${opening.index}`} className="bg-muted rounded-lg p-4 font-question overflow-x-auto whitespace-pre text-sm">
        <code
          className="hljs font-question"
          dangerouslySetInnerHTML={highlighted === null ? undefined : { __html: highlighted }}
        >
          {highlighted === null ? code : undefined}
        </code>
      </pre>,
    );
    if (!closing) {
      textStart = text.length;
      break;
    }
    textStart = closingFence.lastIndex;
    if (text[textStart] === "\n") textStart += 1;
    fence.lastIndex = textStart;
  }
  renderText(text.slice(textStart), textStart);

  return <div id={id} className={`font-question whitespace-pre-wrap ${className}`.trim()}>{parts}</div>;
}
