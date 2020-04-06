import React from "react";
import ReactMarkdown from "react-markdown";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import ts from "react-syntax-highlighter/dist/cjs/languages/hljs/typescript";
import atomOneDark from "react-syntax-highlighter/dist/cjs/styles/hljs/atom-one-dark";
SyntaxHighlighter.registerLanguage("ts", ts);

export function JSDoc(props: { jsdoc: string }) {
  const jsdoc = props.jsdoc.replace(/\n@param/g, "\n\n __param__");
  return (
    <ReactMarkdown
      source={jsdoc}
      renderers={{
        link: (props: any) => (
          <a className="text-blue-400" {...props}>
            {props.children}
          </a>
        ),
        inlineCode: (props: { children: string }) => (
          <code className="p-px font-mono bg-gray-200 rounded-sm dark:bg-gray-900">
            {props.children}
          </code>
        ),
        code: CodeBlock,
        table: (props) => (
          <div className="w-full overflow-x-auto">
            <table
              {...props}
              className="my-2 border border-collapse border-gray-300 dark:border-gray-900"
            />
          </div>
        ),
        tableCell: (props) => (
          <td
            {...props}
            className={
              "border border-gray-300 dark:border-gray-900 px-2 py-1" +
              (props.isHeader ? " font-medium" : "")
            }
          />
        ),
      }}
    />
  );
}

export function CodeBlock(props: { value: string }) {
  return (
    <SyntaxHighlighter
      language="typescript"
      style={atomOneDark}
      customStyle={{
        fontSize: "0.75rem",
        padding: "0.5rem 0.75rem",
        margin: "0.5rem 0",
        borderRadius: "0.25rem",
      }}
    >
      {props.value}
    </SyntaxHighlighter>
  );
}
