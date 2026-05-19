import React from 'react'
import './ChatSuggestions.css'

export interface ChatSuggestionsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof React.DOMAttributes<HTMLDivElement>> {
  suggestions: string[]
  onSelect: (suggestion: string) => void
}

export const ChatSuggestions = React.forwardRef<HTMLDivElement, ChatSuggestionsProps>(
  ({ suggestions, onSelect, className = '', ...props }, ref) => {
    if (!suggestions || suggestions.length === 0) {
      return null
    }

    return (
      <div
        ref={ref}
        className={['chat-suggestions', className].filter(Boolean).join(' ')}
        data-testid="chat-suggestions"
        {...props}
      >
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            className="chat-suggestions__pill"
            onClick={() => onSelect(suggestion)}
            type="button"
          >
            {suggestion}
          </button>
        ))}
      </div>
    )
  }
)

ChatSuggestions.displayName = 'ChatSuggestions'

export default ChatSuggestions
