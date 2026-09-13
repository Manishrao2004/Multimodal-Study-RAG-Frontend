"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { EvidenceItem } from "@/lib/rag-types";

interface RichTextProps {
  children: string;
  evidence?: EvidenceItem[];
}

export function RichText({ children, evidence = [] }: RichTextProps) {
  const markdown = children.replace(/\[(\d+)\]/g, (token, digits: string) => {
    const marker = Number(digits);
    return marker > 0 && marker <= evidence.length ? `[${digits}](#evidence-${digits})` : token;
  });

  return (
    <div className="rich-text text-[16px] leading-8 text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children: linkChildren, ...props }) => {
            const marker = href?.match(/^#evidence-(\d+)$/)?.[1];
            if (marker) {
              return <button type="button" onClick={() => document.getElementById(`evidence-${marker}`)?.scrollIntoView({ behavior: "smooth", block: "center" })} className="citation-link" aria-label={`Go to source ${marker}`}>{linkChildren}</button>;
            }
            return <a href={href} target="_blank" rel="noreferrer" className="text-cyan-deep underline decoration-cyan/40 underline-offset-4 hover:decoration-cyan" {...props}>{linkChildren}</a>;
          },
          h1: ({ children: headingChildren }) => <h1 className="mt-8 text-2xl font-semibold tracking-[-0.025em] first:mt-0">{headingChildren}</h1>,
          h2: ({ children: headingChildren }) => <h2 className="mt-7 text-xl font-semibold tracking-[-0.02em] first:mt-0">{headingChildren}</h2>,
          h3: ({ children: headingChildren }) => <h3 className="mt-6 text-[17px] font-semibold first:mt-0">{headingChildren}</h3>,
          p: ({ children: paragraphChildren }) => <p className="mb-4 last:mb-0">{paragraphChildren}</p>,
          ul: ({ children: listChildren }) => <ul className="mb-4 list-disc space-y-2 pl-6 marker:text-cyan-deep">{listChildren}</ul>,
          ol: ({ children: listChildren }) => <ol className="mb-4 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-cyan-deep">{listChildren}</ol>,
          li: ({ children: itemChildren }) => <li className="pl-1">{itemChildren}</li>,
          blockquote: ({ children: quoteChildren }) => <blockquote className="my-5 border-l-2 border-cyan pl-4 text-ink-muted">{quoteChildren}</blockquote>,
          code: ({ children: codeChildren, className }) => className
            ? <code className="block overflow-x-auto rounded-lg bg-muted px-4 py-3 font-mono text-sm leading-6">{codeChildren}</code>
            : <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em]">{codeChildren}</code>,
          table: ({ children: tableChildren }) => <div className="my-5 overflow-x-auto rounded-lg border border-line"><table className="w-full min-w-[36rem] border-collapse text-left text-sm">{tableChildren}</table></div>,
          th: ({ children: cellChildren }) => <th className="border-b border-line bg-muted px-3 py-2.5 font-semibold">{cellChildren}</th>,
          td: ({ children: cellChildren }) => <td className="border-b border-line px-3 py-2.5 last:border-b-0">{cellChildren}</td>,
          hr: () => <hr className="my-6 border-line" />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
