import { useState } from 'react'
import {
  ChatContainer,
  ChatMessage,
  ChatDivider,
  ChatSuggestions,
  ChatComposer,
  type BotTab,
} from '../index'

export default function ChatShowcase() {
  const [activeBotId, setActiveBotId] = useState('assistant')
  const [composerValue, setComposerValue] = useState('')
  const [contextItems, setContextItems] = useState([
    { id: 'schema', label: 'schema.json' },
  ])

  const bots: BotTab[] = [
    { id: 'assistant', label: 'Assistant', role: 'EXECUTOR', status: 'idle' },
    { id: 'analyzer', label: 'Analyzer', role: 'ANALYST', status: 'idle' },
    { id: 'planner', label: 'Planner', role: 'ARCHITECT', status: 'running' },
  ]

  const handleComposerSubmit = (value: string) => {
    console.log('Submit:', value)
    setComposerValue('')
  }

  const handleSuggestionSelect = (suggestion: string) => {
    console.log('Suggestion selected:', suggestion)
  }

  return (
    <div style={{ padding: '22px 26px', backgroundColor: 'rgb(var(--canvas-bg))', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: 'rgb(var(--canvas-fg-1))', marginBottom: '28px', fontSize: '24px' }}>
          Chat Components
        </h1>

        {/* ChatMessage Variants */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'rgb(var(--canvas-fg-1))' }}>
            ChatMessage Variants
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ChatMessage
              role="user"
              senderName="You"
              timestamp="10:30 AM"
              body="Can you help me analyze this dataset?"
              data-testid="chat-message-user-variant"
            />

            <ChatMessage
              role="bot"
              senderName="Assistant"
              badge="EXECUTOR"
              timestamp="10:31 AM"
              body="I'd be happy to help. What specific aspects would you like me to analyze?"
              data-testid="chat-message-bot-variant"
            />

            <ChatMessage
              role="user"
              senderName="You"
              timestamp="10:32 AM"
              body="Let me get some statistics on the distribution"
            />

            <ChatMessage
              role="bot"
              senderName="Assistant"
              badge="EXECUTOR"
              timestamp="10:33 AM"
              body="Running statistical analysis..."
              toolBlock={{
                name: 'analyze_distribution',
                status: 'success',
                output: [
                  { key: 'mean', value: '42.3' },
                  { key: 'median', value: '41.0' },
                  { key: 'std_dev', value: '8.5' },
                ],
              }}
            />
          </div>
        </section>

        {/* ToolBlock States */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'rgb(var(--canvas-fg-1))' }}>
            ToolBlock States
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ChatMessage
              role="bot"
              senderName="Analyzer"
              badge="ANALYST"
              timestamp="11:00 AM"
              body="Processing your request..."
              toolBlock={{
                name: 'query_database',
                status: 'running',
              }}
            />

            <ChatMessage
              role="bot"
              senderName="Analyzer"
              badge="ANALYST"
              timestamp="11:01 AM"
              body="Query completed successfully."
              toolBlock={{
                name: 'query_database',
                status: 'success',
                output: [
                  { key: 'rows', value: '1,234' },
                  { key: 'duration', value: '245ms' },
                ],
              }}
            />

            <ChatMessage
              role="bot"
              senderName="Analyzer"
              badge="ANALYST"
              timestamp="11:02 AM"
              body="There was an issue with the query."
              toolBlock={{
                name: 'query_database',
                status: 'error',
                output: [{ value: 'Connection timeout after 30s' }],
              }}
            />
          </div>
        </section>

        {/* ChatDivider */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'rgb(var(--canvas-fg-1))' }}>
            ChatDivider
          </h2>
          <ChatDivider label="May 18, 2024" />
        </section>

        {/* ChatSuggestions */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'rgb(var(--canvas-fg-1))' }}>
            ChatSuggestions
          </h2>
          <ChatSuggestions
            suggestions={['Show me the plan', 'Approve & run', 'Cancel']}
            onSelect={handleSuggestionSelect}
          />
          <div style={{ marginTop: '16px', color: 'rgb(var(--canvas-fg-3))', fontSize: '12px' }}>
            Empty suggestions:
          </div>
          <ChatSuggestions suggestions={[]} onSelect={handleSuggestionSelect} />
        </section>

        {/* Full Chat Container */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'rgb(var(--canvas-fg-1))' }}>
            Full Chat Container
          </h2>
          <div style={{ height: '500px' }}>
            <ChatContainer
              bots={bots}
              activeBotId={activeBotId}
              onBotChange={setActiveBotId}
            >
              <ChatMessage
                role="bot"
                senderName="Assistant"
                badge="EXECUTOR"
                timestamp="10:15 AM"
                body="Hello! How can I help you today?"
              />
              <ChatMessage
                role="user"
                senderName="You"
                timestamp="10:16 AM"
                body="I need to process a large dataset"
              />
              <ChatMessage
                role="bot"
                senderName="Assistant"
                badge="EXECUTOR"
                timestamp="10:17 AM"
                body="I can help with that. Let me start the processing job."
                toolBlock={{
                  name: 'process_data',
                  status: 'success',
                  output: [
                    { key: 'files', value: '145' },
                    { key: 'total_size', value: '2.3 GB' },
                  ],
                }}
              />
              <ChatDivider label="Session ended" />
            </ChatContainer>
          </div>
        </section>

        {/* ChatComposer */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'rgb(var(--canvas-fg-1))' }}>
            ChatComposer
          </h2>
          <ChatComposer
            placeholder="Ask assistant something..."
            value={composerValue}
            onChange={setComposerValue}
            onSubmit={handleComposerSubmit}
            onContextChange={setContextItems}
            scopeLabel="Assistant"
            contextItems={contextItems}
          />
        </section>

        {/* Light/Dark Canvas Mode Test */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'rgb(var(--canvas-fg-1))' }}>
            Canvas Mode Toggle
          </h2>
          <p style={{ color: 'rgb(var(--canvas-fg-3))', fontSize: '12px', marginBottom: '16px' }}>
            Current canvas mode is controlled by the body.dark-canvas class. All components should render correctly in
            both modes.
          </p>
          <button
            onClick={() => {
              document.body.classList.toggle('dark-canvas')
            }}
            style={{
              padding: '8px 16px',
              background: 'rgb(var(--accent-primary))',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            Toggle Dark Canvas Mode
          </button>
        </section>
      </div>
    </div>
  )
}
