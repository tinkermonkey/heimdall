import { useState } from 'react'
import {
  ChatMessage,
  ChatDivider,
  ChatSuggestions,
  ChatComposer,
  ChatContainer,
  type BotTab,
  type Attachment,
  type ContextItem,
} from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoCard, PropsTable, PropRow } from '../components/ShowcaseSection'

const fg2 = 'rgb(var(--canvas-fg-2, 55 65 81))'

const BOTS: BotTab[] = [
  { id: 'assistant', label: 'Assistant', role: 'EXECUTOR', status: 'idle' },
  { id: 'analyzer', label: 'Analyzer', role: 'ANALYST', status: 'healthy' },
  { id: 'planner', label: 'Planner', role: 'ARCHITECT', status: 'busy' },
]

export function ChatMessageShowcase() {
  return (
    <div>
      <PageHeader name="ChatMessage" description="A single chat turn — user or bot. Bots can include an inline ToolBlock (running / success / error) and a collapsible ThinkingBlock." />
      <ShowcaseSection label="User message">
        <ChatMessage role="user" senderName="You" timestamp="10:30 AM" body="Can you help me analyze this dataset?" />
      </ShowcaseSection>
      <ShowcaseSection label="Bot message">
        <ChatMessage role="bot" senderName="Assistant" badge="EXECUTOR" timestamp="10:31 AM" body="I'd be happy to help. What aspects would you like me to analyze?" />
      </ShowcaseSection>
      <ShowcaseSection label="ToolBlock states">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChatMessage
            role="bot"
            senderName="Analyzer"
            badge="ANALYST"
            timestamp="11:00 AM"
            body="Running query..."
            toolBlock={{ name: 'query_database', status: 'running' }}
          />
          <ChatMessage
            role="bot"
            senderName="Analyzer"
            badge="ANALYST"
            timestamp="11:01 AM"
            body="Query complete."
            toolBlock={{
              name: 'query_database',
              status: 'success',
              output: [{ key: 'rows', value: '1,234' }, { key: 'duration', value: '245ms' }],
            }}
          />
          <ChatMessage
            role="bot"
            senderName="Analyzer"
            badge="ANALYST"
            timestamp="11:02 AM"
            body="There was an issue."
            toolBlock={{
              name: 'query_database',
              status: 'error',
              output: [{ value: 'Connection timeout after 30s' }],
            }}
          />
        </div>
      </ShowcaseSection>
      <ShowcaseSection label="ThinkingBlock">
        <ChatMessage
          role="bot"
          senderName="Assistant"
          badge="EXECUTOR"
          timestamp="11:03 AM"
          body="Let me think through this step by step..."
          thinkingBlock={{
            content: `Breaking down the problem:\n1. Load the dataset\n2. Calculate distribution metrics\n3. Format and return results`,
          }}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props (ChatMessage)">
        <PropsTable>
          <PropRow name="role" type="'user' | 'bot'" description="Determines alignment, avatar color, and badge visibility" />
          <PropRow name="senderName" type="string" description="Display name shown above the message" />
          <PropRow name="badge" type="string" description="Bot role badge (e.g. EXECUTOR, ANALYST)" />
          <PropRow name="timestamp" type="string" description="Formatted time string" />
          <PropRow name="body" type="string" description="Message text content" />
          <PropRow name="toolBlock" type="ToolBlockData" description="Inline tool call with status and optional output rows" />
          <PropRow name="thinkingBlock" type="ThinkingBlockData" description="Collapsible reasoning block with free-text content" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ChatDividerShowcase() {
  return (
    <div>
      <PageHeader name="ChatDivider" description="Horizontal rule with a centered date/session label. Separates conversation sessions in a chat thread." />
      <ShowcaseSection label="Date divider">
        <ChatDivider label="May 18, 2026" />
      </ShowcaseSection>
      <ShowcaseSection label="Session divider">
        <ChatDivider label="New session" />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="label" type="string" description="Text displayed in the center of the divider" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ChatSuggestionsShowcase() {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div>
      <PageHeader name="ChatSuggestions" description="Row of quick-reply suggestion chips. Selecting one calls onSelect and disables the rest." />
      <ShowcaseSection label="Pending suggestions" description="Click a chip to select it.">
        <ChatSuggestions
          suggestions={['Show me the plan', 'Approve & run', 'Cancel']}
          onSelect={s => setSelected(s)}
        />
        {selected && (
          <div style={{ marginTop: 8, fontSize: 12, color: fg2 }}>Selected: <em>{selected}</em></div>
        )}
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="suggestions" type="string[]" description="List of suggestion chip labels" />
          <PropRow name="onSelect" type="(suggestion: string) => void" description="Called when the user clicks a chip" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ChatComposerShowcase() {
  const [value, setValue] = useState('')
  const [context, setContext] = useState<ContextItem[]>([{ id: 'schema', label: 'schema.json' }])
  const [attachments, setAttachments] = useState<Attachment[]>([])

  return (
    <div>
      <PageHeader name="ChatComposer" description="Rich message input with context chips, file attachment previews, and submit. Supports Enter-to-submit." />
      <ShowcaseSection label="With context item">
        <ChatComposer
          value={value}
          onChange={setValue}
          onSubmit={(v, ctx) => { console.log('submit', v, ctx); setValue('') }}
          contextItems={context}
          onContextChange={items => setContext(items)}
          attachments={attachments}
          onAttachmentChange={items => setAttachments(items)}
          placeholder="Ask something..."
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="value" type="string" description="Controlled textarea value" />
          <PropRow name="onChange" type="(v: string) => void" description="Called on every keystroke" />
          <PropRow name="onSubmit" type="(v, ctx) => void" description="Called on Enter or submit button click" />
          <PropRow name="contextItems" type="ContextItem[]" description="Chips displayed above the input" />
          <PropRow name="onContextRemove" type="(id: string) => void" description="Remove a context chip" />
          <PropRow name="attachments" type="Attachment[]" description="File attachment previews" />
          <PropRow name="onAttachmentRemove" type="(id: string) => void" description="Remove a file attachment" />
          <PropRow name="placeholder" type="string" description="Textarea placeholder" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ChatContainerShowcase() {
  const [activeBotId, setActiveBotId] = useState('assistant')
  const [composerValue, setComposerValue] = useState('')

  return (
    <div>
      <PageHeader name="ChatContainer" description="Full chat panel composing bot tabs, message thread, date dividers, and a composer. Manages bot switching and session layout." />
      <ShowcaseSection label="Multi-bot chat">
        <DemoCard>
          <ChatContainer
            bots={BOTS}
            activeBotId={activeBotId}
            onBotChange={setActiveBotId}
            composer={
              <ChatComposer
                value={composerValue}
                onChange={setComposerValue}
                onSubmit={(v) => { console.log('submit', v); setComposerValue('') }}
                placeholder="Ask the assistant..."
              />
            }
          >
            <ChatDivider label="May 19, 2026" />
            <ChatMessage role="user" senderName="You" timestamp="10:30 AM" body="What's the status of the pipeline?" />
            <ChatMessage role="bot" senderName="Assistant" badge="EXECUTOR" timestamp="10:31 AM" body="The pipeline completed 3 stages and is paused at validation." toolBlock={{ name: 'get_pipeline_status', status: 'success', output: [{ key: 'stage', value: '3/5' }, { key: 'status', value: 'paused' }] }} />
          </ChatContainer>
        </DemoCard>
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="bots" type="BotTab[]" description="Bot tab definitions — id, label, role, status" />
          <PropRow name="activeBotId" type="string" description="Currently selected bot tab ID" />
          <PropRow name="onBotChange" type="(id: string) => void" description="Called when user switches bot tabs" />
          <PropRow name="messages" type="ReactNode[]" description="Thread content — ChatMessage and ChatDivider nodes" />
          <PropRow name="composer" type="ReactNode" description="Composer slot — typically a ChatComposer" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
