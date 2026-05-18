import React, { useRef, useEffect } from 'react'
import './ChatContainer.css'

export interface BotTab {
  id: string
  label: string
  role: string
  status: 'idle' | 'running' | 'busy'
}

export interface ChatContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  bots?: BotTab[]
  activeBotId?: string
  onBotChange?: (botId: string) => void
  autoScroll?: boolean
}

export const ChatContainer = React.forwardRef<HTMLDivElement, ChatContainerProps>(
  (
    {
      children,
      bots = [],
      activeBotId,
      onBotChange,
      autoScroll = true,
      className = '',
      ...props
    },
    ref
  ) => {
    const threadRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (autoScroll && threadRef.current) {
        threadRef.current.scrollTop = threadRef.current.scrollHeight
      }
    }, [children, autoScroll])

    return (
      <div
        ref={ref}
        className={['chat-container', className].filter(Boolean).join(' ')}
        data-testid="chat-container"
        {...props}
      >
        {bots && bots.length > 0 && (
          <div className="chat-container__bot-tabs">
            {bots.map((bot) => (
              <button
                key={bot.id}
                className={[
                  'chat-container__bot-tab',
                  activeBotId === bot.id && 'chat-container__bot-tab--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onBotChange?.(bot.id)}
                aria-pressed={activeBotId === bot.id}
              >
                <span className="chat-container__bot-label">
                  <span
                    className={[
                      'chat-container__bot-status',
                      `chat-container__bot-status--${bot.status}`,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  />
                  {bot.label}
                </span>
                <span className="chat-container__bot-role">{bot.role}</span>
              </button>
            ))}
          </div>
        )}

        <div
          ref={threadRef}
          className="chat-container__thread"
        >
          <div className="chat-container__messages">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

ChatContainer.displayName = 'ChatContainer'

export default ChatContainer
