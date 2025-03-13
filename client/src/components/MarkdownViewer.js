import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MarkdownViewer = ({ markdown }) => {
  return (
    <div className="markdown-content bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto my-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4 mt-6 text-gray-800" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3 mt-5 text-gray-800" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-2 mt-4 text-gray-800" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 text-gray-700" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc ml-8 mb-4 text-gray-700" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-8 mb-4 text-gray-700" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          a: ({ node, ...props }) => (
            <a 
              className="text-blue-600 hover:text-blue-800 hover:underline" 
              target="_blank"
              rel="noopener noreferrer"
              {...props} 
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-200 pl-4 italic my-4" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-200" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-200" {...props} />,
          tr: ({ node, ...props }) => <tr {...props} />,
          th: ({ node, ...props }) => (
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" 
              {...props} 
            />
          ),
          td: ({ node, ...props }) => <td className="px-6 py-4 whitespace-nowrap" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-6 border-gray-300" {...props} />,
          img: ({ node, ...props }) => (
            <img className="max-w-full h-auto my-4 mx-auto rounded-lg shadow-md" {...props} />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownViewer; 