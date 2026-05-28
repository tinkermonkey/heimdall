import { useState } from 'react'
import {
  ChatMessage,
  ToolBlock,
  ThinkingBlock,
  ChatDivider,
  ChatSuggestions,
  ChatComposer,
  ChatContainer,
} from '@tinkermonkey/heimdall-ui'
import { BareSection, AxisRow, Caption } from '../components/BareSection'

export function BareChatMessage() {
  return (
    <BareSection name="ChatMessage">
      <AxisRow label="default user" align="stretch">
        <div style={{ width: 640 }}>
          <ChatMessage
            role="user"
            senderName="Daisy"
            timestamp="2:03 PM"
            body="What's the latest pipeline status?"
          />
        </div>
      </AxisRow>
      <AxisRow label="default bot" align="stretch">
        <div style={{ width: 640 }}>
          <ChatMessage
            role="bot"
            senderName="Heimdall"
            timestamp="2:03 PM"
            body="3 pipelines running, 1 failed."
          />
        </div>
      </AxisRow>
      <AxisRow label="with badge" align="stretch">
        <div style={{ width: 640 }}>
          <ChatMessage
            role="bot"
            senderName="Heimdall"
            timestamp="2:04 PM"
            badge="ops"
            body="Restarting failed pipeline."
          />
        </div>
      </AxisRow>
      <AxisRow label="with thinking" align="stretch">
        <div style={{ width: 640 }}>
          <ChatMessage
            role="bot"
            senderName="Heimdall"
            timestamp="2:05 PM"
            body="Checking schema validity…"
            thinkingBlock={{ content: 'Compare cls_organism v3 to v4. Diff fields. Return summary.' }}
          />
        </div>
      </AxisRow>
      <AxisRow label="with tool" align="stretch">
        <div style={{ width: 640 }}>
          <ChatMessage
            role="bot"
            senderName="Heimdall"
            timestamp="2:06 PM"
            body="Fetched class graph."
            toolBlock={{
              name: 'graph.fetch',
              status: 'success',
              output: [
                { key: 'nodes', value: '124' },
                { key: 'edges', value: '312' },
              ],
            }}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareToolBlock() {
  return (
    <BareSection name="ToolBlock">
      <AxisRow label="status" align="stretch">
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToolBlock name="graph.fetch" status="running" />
          <ToolBlock
            name="graph.fetch"
            status="success"
            output={[
              { key: 'nodes', value: '124' },
              { key: 'edges', value: '312' },
            ]}
          />
          <ToolBlock
            name="graph.fetch"
            status="error"
            output={[{ value: 'Connection refused.' }]}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareThinkingBlock() {
  return (
    <BareSection name="ThinkingBlock">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 480 }}>
          <ThinkingBlock content="Compare cls_organism v3 to v4 and summarize the diff." />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareChatDivider() {
  return (
    <BareSection name="ChatDivider">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 480 }}>
          <ChatDivider label="Today" />
        </div>
      </AxisRow>
      <AxisRow label="other labels" align="stretch">
        <div style={{ width: 480, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ChatDivider label="Yesterday" />
          <ChatDivider label="March 12, 2026" />
          <ChatDivider label="new context" />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareChatSuggestions() {
  const [selected, setSelected] = useState<string>('')
  return (
    <BareSection name="ChatSuggestions">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 640 }}>
          <ChatSuggestions
            suggestions={[
              'Summarize the schema',
              'Show failed pipelines',
              'Why did this run fail?',
            ]}
            onSelect={setSelected}
            selected={selected}
          />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareChatComposer() {
  const [value, setValue] = useState('')
  return (
    <BareSection name="ChatComposer">
      <AxisRow label="default" align="stretch">
        <div style={{ width: 640 }}>
          <ChatComposer value={value} onChange={setValue} onSubmit={() => setValue('')} />
        </div>
      </AxisRow>
      <AxisRow label="with context + attachments" align="stretch">
        <div style={{ width: 640 }}>
          <ChatComposer
            value={value}
            onChange={setValue}
            onSubmit={() => setValue('')}
            scopeLabel="workspace"
            contextItems={[
              { id: 'a', label: 'cls_organism' },
              { id: 'b', label: 'ingest_v2' },
            ]}
            attachments={[{ id: 'f', name: 'notes.md', size: 4096 }]}
          />
        </div>
      </AxisRow>
      <AxisRow label="loading" align="stretch">
        <div style={{ width: 640 }}>
          <ChatComposer value="" onChange={() => {}} onSubmit={() => {}} loading />
        </div>
      </AxisRow>
      <AxisRow label="disabled" align="stretch">
        <div style={{ width: 640 }}>
          <ChatComposer value="" onChange={() => {}} onSubmit={() => {}} disabled />
        </div>
      </AxisRow>
    </BareSection>
  )
}

export function BareChatContainer() {
  const [value, setValue] = useState('')
  const [activeBot, setActiveBot] = useState('heimdall')
  return (
    <BareSection name="ChatContainer">
      <AxisRow label="default" align="stretch">
        <Caption label="bots + composer">
          <div style={{ width: 720, height: 480 }}>
            <ChatContainer
              bots={[
                { id: 'heimdall', label: 'Heimdall', role: 'ops', status: 'healthy' },
                { id: 'analyst', label: 'Analyst', role: 'analyze', status: 'idle' },
              ]}
              activeBotId={activeBot}
              onBotChange={setActiveBot}
              composer={<ChatComposer value={value} onChange={setValue} onSubmit={() => setValue('')} />}
            >
              <ChatMessage role="user" senderName="Daisy" timestamp="2:03" body="Status?" />
              <ChatMessage role="bot" senderName="Heimdall" timestamp="2:03" body="3 running, 1 failed." />
              <ChatDivider label="2:10" />
              <ChatMessage role="user" senderName="Daisy" timestamp="2:10" body="Restart failed pipeline." />
              <ChatMessage role="bot" senderName="Heimdall" timestamp="2:10" body="Restarting…" />
            </ChatContainer>
          </div>
        </Caption>
      </AxisRow>
    </BareSection>
  )
}
