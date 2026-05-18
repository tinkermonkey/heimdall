import React, { useRef, useEffect } from 'react'
import './ChatComposer.css'
import { Button } from './Button'
import { Icon } from './Icon'

export interface ContextItem {
  id: string
  label: string
}

export interface ChatComposerProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onContextChange?: (items: ContextItem[]) => void
  scopeLabel?: string
  contextItems?: ContextItem[]
  className?: string
}

export const ChatComposer = React.forwardRef<HTMLDivElement, ChatComposerProps>(
  (
    {
      placeholder = 'Type a message...',
      value,
      onChange,
      onSubmit,
      onContextChange,
      scopeLabel,
      contextItems = [],
      className = '',
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        const newHeight = Math.min(
          textareaRef.current.scrollHeight,
          200
        )
        textareaRef.current.style.height = `${newHeight}px`
      }
    }, [value])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (value.trim()) {
          onSubmit(value)
        }
      }
    }

    const handleSubmit = () => {
      if (value.trim()) {
        onSubmit(value)
      }
    }

    const handleRemoveContext = (id: string) => {
      const updated = contextItems.filter((item) => item.id !== id)
      onContextChange?.(updated)
    }

    return (
      <div
        ref={ref}
        className={['chat-composer', className].filter(Boolean).join(' ')}
        data-testid="chat-composer"
      >
        <div className="chat-composer__tools">
          {scopeLabel && (
            <span className="chat-composer__scope">
              talking to <b>{scopeLabel}</b>
            </span>
          )}
          {contextItems.map((item) => (
            <div key={item.id} className="chat-composer__context-pill">
              <span className="chat-composer__context-label">{item.label}</span>
              <button
                className="chat-composer__context-remove"
                onClick={() => handleRemoveContext(item.id)}
                aria-label={`Remove ${item.label}`}
                type="button"
              >
                <Icon name="x" size={10} />
              </button>
            </div>
          ))}
        </div>

        <div className="chat-composer__input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-composer__input"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />

          <div className="chat-composer__footer">
            <span className="chat-composer__hint">
              <b>↵</b> send · <b>⇧↵</b> newline
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!value.trim()}
            >
              <Icon name="send" size={12} />
              send
            </Button>
          </div>
        </div>
      </div>
    )
  }
)

ChatComposer.displayName = 'ChatComposer'

export default ChatComposer
