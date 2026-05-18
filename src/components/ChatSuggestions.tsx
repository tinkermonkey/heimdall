import React from 'react'
import './ChatSuggestions.css'

export interface ChatSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export const ChatSuggestions = React.forwardRef<HTMLDivElement, ChatSuggestionsProps>(
  ({ suggestions, onSelect, className = '' }, ref) => {
    if (!suggestions || suggestions.length === 0) {
      return null
    }

    return (
      <div
        ref={ref}
        className={['chat-suggestions', className].filter(Boolean).join(' ')}
        data-testid="chat-suggestions"
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
