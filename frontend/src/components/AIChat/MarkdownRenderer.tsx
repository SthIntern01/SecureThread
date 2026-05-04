import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css'; // Modern dark theme
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="markdown-body text-sm md:text-base">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const [copied, setCopied] = useState(false);

            const handleCopy = () => {
              navigator.clipboard.writeText(codeString);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            };

            return !inline ? (
              <div className="relative group my-4 rounded-lg overflow-hidden border border-gray-700/50 bg-[#282c34]">
                <div className="flex items-center justify-between px-4 py-2 bg-black/40 text-xs text-gray-400">
                  <span className="uppercase">{language || 'text'}</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 hover:text-white transition-colors p-1"
                    aria-label="Copy code"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </div>
              </div>
            ) : (
              <code className="bg-gray-200 dark:bg-gray-800 text-pink-600 dark:text-pink-400 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-4 leading-relaxed last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>;
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-gray-100">{children}</h3>;
          },
          a({ href, children }) {
            return <a href={href} className="text-[#003D6B] dark:text-orange-400 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>;
          },
          blockquote({ children }) {
            return <blockquote className="border-l-4 border-[#003D6B] dark:border-orange-500 pl-4 py-1 my-4 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 italic rounded-r-lg">{children}</blockquote>;
          },
          table({ children }) {
            return <div className="overflow-x-auto my-4"><table className="w-full text-left border-collapse">{children}</table></div>;
          },
          th({ children }) {
            return <th className="border-b-2 border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800 font-semibold">{children}</th>;
          },
          td({ children }) {
            return <td className="border-b border-gray-200 dark:border-gray-700 px-4 py-2">{children}</td>;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
