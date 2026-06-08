import React, { memo, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './ChatMarkdownContent.css'

export interface ChatMarkdownContentProps {
  content: string
  isStreaming?: boolean
  className?: string
  /** Optional syntax highlighter. Receives the raw code string and detected language.
   *  Return a React node — typically a SyntaxHighlighter element.
   *  When omitted, code blocks render as plain pre/code with Heimdall token styling. */
  syntaxHighlighter?: (code: string, language: string) => React.ReactNode
}

export const ChatMarkdownContent = memo<ChatMarkdownContentProps>(
  ({ content, isStreaming = false, className, syntaxHighlighter }) => {
    const components = useMemo<Components>(
      () => ({
        p: ({ children }) => <p className="chat-markdown__p">{children}</p>,

        h1: ({ children }) => <h1 className="chat-markdown__h1">{children}</h1>,
        h2: ({ children }) => <h2 className="chat-markdown__h2">{children}</h2>,
        h3: ({ children }) => <h3 className="chat-markdown__h3">{children}</h3>,

        ul: ({ children }) => <ul className="chat-markdown__ul">{children}</ul>,
        ol: ({ children }) => <ol className="chat-markdown__ol">{children}</ol>,
        li: ({ children }) => <li className="chat-markdown__li">{children}</li>,

        blockquote: ({ children }) => (
          <blockquote className="chat-markdown__blockquote">{children}</blockquote>
        ),

        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-markdown__link"
          >
            {children}
          </a>
        ),

        table: ({ children }) => (
          <div className="chat-markdown__table-wrapper">
            <table className="chat-markdown__table">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="chat-markdown__thead">{children}</thead>,
        tbody: ({ children }) => <tbody className="chat-markdown__tbody">{children}</tbody>,
        tr: ({ children }) => <tr className="chat-markdown__tr">{children}</tr>,
        th: ({ children }) => <th className="chat-markdown__th">{children}</th>,
        td: ({ children }) => <td className="chat-markdown__td">{children}</td>,

        // Transparent passthrough — the code component owns the <pre> wrapper
        // so that a consumer-supplied syntaxHighlighter can render its own <pre>
        // without producing nested <pre> elements.
        pre: ({ children }) => <>{children}</>,

        code: ({ children, className }) => {
          const match = /language-(\w+)/.exec(className ?? '')

          if (!match) {
            return <code className="chat-markdown__code-inline">{children}</code>
          }

          const language = match[1]
          const codeString = String(children).replace(/\n$/, '')

          if (syntaxHighlighter) {
            return <>{syntaxHighlighter(codeString, language)}</>
          }

          return (
            <pre className="chat-markdown__pre">
              <code className="chat-markdown__code-block">{children}</code>
            </pre>
          )
        },

        hr: () => <hr className="chat-markdown__hr" />,

        strong: ({ children }) => (
          <strong className="chat-markdown__strong">{children}</strong>
        ),
        em: ({ children }) => <em className="chat-markdown__em">{children}</em>,
      }),
      [syntaxHighlighter]
    )

    const rootClass = [
      'chat-markdown',
      isStreaming && 'chat-markdown--streaming',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div className={rootClass} aria-busy={isStreaming || undefined}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </div>
    )
  }
)

ChatMarkdownContent.displayName = 'ChatMarkdownContent'

export default ChatMarkdownContent
