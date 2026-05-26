import { useState } from 'react'
import {
  ChatMessage,
  ToolBlock,
  ThinkingBlock,
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
      <ShowcaseSection label="Avatar — custom initials and image URL">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ChatMessage role="user" senderName="Jordan Blake" avatar="JB" timestamp="10:32 AM" body="Custom initials override." />
          <ChatMessage role="bot" senderName="Assistant" avatar="https://api.dicebear.com/9.x/bottts/svg?seed=heimdall" timestamp="10:33 AM" body="Avatar rendered from URL." />
        </div>
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
          <PropRow name="role" type="'user' | 'bot'" description="Determines avatar color and text emphasis" />
          <PropRow name="senderName" type="string" description="Display name shown above the message; used as avatar fallback initials" />
          <PropRow name="avatar" type="string" description="Avatar override — URL renders as image, plain string renders as text initials" />
          <PropRow name="badge" type="string" description="Bot role badge displayed in monospace uppercase (e.g. EXECUTOR, ANALYST)" />
          <PropRow name="timestamp" type="string" description="Formatted time string shown at the trailing end of the meta row" />
          <PropRow name="body" type="ReactNode" description="Message content — accepts plain text or React elements" />
          <PropRow name="toolBlock" type="ToolBlockData" description="Inline tool call with status and optional output rows" />
          <PropRow name="thinkingBlock" type="ThinkingBlockData" description="Collapsible reasoning block with free-text content" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ToolBlockShowcase() {
  return (
    <div>
      <PageHeader name="ToolBlock" description="Collapsible inline block showing a tool call name, status, and optional key/value output rows." />
      <ShowcaseSection label="Running">
        <ToolBlock name="query_database" status="running" />
      </ShowcaseSection>
      <ShowcaseSection label="Success with output">
        <ToolBlock
          name="query_database"
          status="success"
          output={[{ key: 'rows', value: '1,234' }, { key: 'duration', value: '245ms' }]}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Error with output">
        <ToolBlock
          name="query_database"
          status="error"
          output={[{ value: 'Connection timeout after 30s' }]}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Pre-collapsed (defaultCollapsed)">
        <ToolBlock
          name="fetch_schema"
          status="success"
          defaultCollapsed
          output={[{ key: 'tables', value: '12' }, { key: 'views', value: '3' }]}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="name" type="string" description="Tool call name displayed in the header" />
          <PropRow name="status" type="'running' | 'success' | 'error'" description="Drives the status color and label" />
          <PropRow name="output" type="Array<{ key?: string; value: string }>" description="Key/value rows shown in the expanded output panel" />
          <PropRow name="defaultCollapsed" type="boolean" default="false" description="Initial collapsed state; useful for pre-run tool calls in loaded history" />
          <PropRow name="onToggleCollapsed" type="(collapsed: boolean) => void" description="Called when the user toggles the block open or closed" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ThinkingBlockShowcase() {
  return (
    <div>
      <PageHeader name="ThinkingBlock" description="Collapsible block displaying a model's internal reasoning or reflection text. Renders content in monospace with a violet left border." />
      <ShowcaseSection label="Default (expanded)">
        <ThinkingBlock
          content={`Breaking down the problem:\n1. Load the dataset\n2. Calculate distribution metrics\n3. Format and return results`}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Pre-collapsed (defaultCollapsed)">
        <ThinkingBlock
          content={`This is the internal reasoning that is hidden by default.`}
          defaultCollapsed
        />
      </ShowcaseSection>
      <ShowcaseSection label="Custom label">
        <ThinkingBlock
          label="reasoning"
          content={`Step 1: Identify the entities.\nStep 2: Map relationships.\nStep 3: Return the graph.`}
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="content" type="string" description="Reasoning text rendered in monospace with pre-wrap whitespace" />
          <PropRow name="label" type="string" default="thinking" description="Header label shown in uppercase monospace" />
          <PropRow name="defaultCollapsed" type="boolean" default="false" description="Initial collapsed state; useful when rendering historical messages" />
          <PropRow name="onToggleCollapsed" type="(collapsed: boolean) => void" description="Called when the user toggles the block open or closed" />
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
          <PropRow name="label" type="string" description="Text displayed in the center of the divider; also used as aria-label on the separator element" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

export function ChatSuggestionsShowcase() {
  const [selected, setSelected] = useState<string | undefined>(undefined)

  return (
    <div>
      <PageHeader name="ChatSuggestions" description="Row of quick-reply suggestion chips. When a selection is made the chosen chip is highlighted and the others are disabled." />
      <ShowcaseSection label="Pending — no selection" description="Click a chip to select it.">
        <ChatSuggestions
          suggestions={['Show me the plan', 'Approve & run', 'Cancel']}
          onSelect={s => setSelected(s)}
        />
      </ShowcaseSection>
      <ShowcaseSection label="With selection (controlled via selected prop)">
        <ChatSuggestions
          suggestions={['Show me the plan', 'Approve & run', 'Cancel']}
          selected={selected}
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
          <PropRow name="selected" type="string" description="Currently selected suggestion; when set, unselected chips are disabled" />
          <PropRow name="aria-label" type="string" default="Suggestions" description="Accessible group label for the chip set" />
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
      <ShowcaseSection label="scopeLabel — active bot context">
        <ChatComposer
          value=""
          onChange={() => {}}
          onSubmit={() => {}}
          scopeLabel="assistant"
          placeholder="Ask the assistant..."
        />
      </ShowcaseSection>
      <ShowcaseSection label="disabled — bot is responding">
        <ChatComposer
          value=""
          onChange={() => {}}
          onSubmit={() => {}}
          disabled
          placeholder="Waiting for response..."
        />
      </ShowcaseSection>
      <ShowcaseSection label="loading — send in progress">
        <ChatComposer
          value="Analyze the pipeline"
          onChange={() => {}}
          onSubmit={() => {}}
          loading
        />
      </ShowcaseSection>
      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="value" type="string" description="Controlled textarea value" />
          <PropRow name="onChange" type="(v: string) => void" description="Called on every keystroke" />
          <PropRow name="onSubmit" type="(v: string, ctx: ContextItem[]) => void" description="Called on Enter or send button click; receives current value and context items" />
          <PropRow name="contextItems" type="ContextItem[]" default="[]" description="Context chips displayed above the input" />
          <PropRow name="onContextChange" type="(items: ContextItem[]) => void" description="Called with updated list when a context chip is removed" />
          <PropRow name="attachments" type="Attachment[]" default="[]" description="File attachment previews" />
          <PropRow name="onAttachmentChange" type="(attachments: Attachment[]) => void" description="Called with updated list when an attachment is added or removed" />
          <PropRow name="placeholder" type="string" default="'Type a message...'" description="Textarea placeholder text" />
          <PropRow name="scopeLabel" type="string" description="Monospace label shown at the leading edge of the tools bar (e.g. the active bot name)" />
          <PropRow name="label" type="string" default="'Message'" description="Accessible aria-label for the textarea" />
          <PropRow name="disabled" type="boolean" default="false" description="Disables the textarea, attach button, and send button" />
          <PropRow name="loading" type="boolean" default="false" description="Disables the send button while a response is in progress" />
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
          <PropRow name="children" type="ReactNode" description="Thread content — ChatMessage, ChatDivider, and other nodes rendered in the scrollable message area" />
          <PropRow name="bots" type="BotTab[]" description="Bot tab definitions — id, label, role, status" />
          <PropRow name="activeBotId" type="string" description="Currently selected bot tab ID" />
          <PropRow name="onBotChange" type="(id: string) => void" description="Called when user switches bot tabs" />
          <PropRow name="autoScroll" type="boolean" default="true" description="When true, scrolls the thread to the bottom whenever children change" />
          <PropRow name="composer" type="ReactNode" description="Composer slot — typically a ChatComposer" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}
