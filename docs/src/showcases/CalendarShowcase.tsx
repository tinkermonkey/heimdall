import { useState } from 'react'
import { Calendar, MiniCalendar, type CalendarEvent } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

const generateSampleEvents = (): CalendarEvent[] => [
  { id: 'event-0', title: 'Team Standup', calendarId: 'cal-1', startDate: new Date(2026, 5, 4) },
  { id: 'event-1', title: 'Design Review', calendarId: 'cal-2', startDate: new Date(2026, 5, 5) },
  { id: 'event-2', title: 'Sprint Planning', calendarId: 'cal-3', startDate: new Date(2026, 5, 8) },
  { id: 'event-3', title: 'Engineering Sync', calendarId: 'cal-1', startDate: new Date(2026, 5, 10) },
  { id: 'event-4', title: 'Product Demo', calendarId: 'cal-2', startDate: new Date(2026, 5, 12) },
  { id: 'event-5', title: 'Retrospective', calendarId: 'cal-3', startDate: new Date(2026, 5, 15) },
  { id: 'event-6', title: 'Quarterly Review', calendarId: 'cal-1', startDate: new Date(2026, 5, 18) },
  { id: 'event-7', title: 'Budget Planning', calendarId: 'cal-2', startDate: new Date(2026, 5, 22) },
]

export function CalendarShowcase() {
  const [focusedDate, setFocusedDate] = useState(new Date(2026, 5, 4))
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2026, 5, 4))
  const [events] = useState<CalendarEvent[]>(generateSampleEvents())

  const calendarColors: Record<string, string> = {
    'cal-1': 'rgb(var(--status-cyan))',
    'cal-2': 'rgb(var(--status-emerald))',
    'cal-3': 'rgb(var(--status-rose))',
  }

  return (
    <div>
      <PageHeader
        name="Calendar"
        description="Multi-view calendar component supporting month, week, day, and agenda views with event rendering, keyboard navigation, and color-coded calendar support."
      />

      <ShowcaseSection label="Month View">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <Calendar
            view="month"
            focusedDate={focusedDate}
            selectedDate={selectedDate}
            events={events}
            calendarColors={calendarColors}
            onNavigate={setFocusedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Week View">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <Calendar
            view="week"
            focusedDate={focusedDate}
            selectedDate={selectedDate}
            events={events}
            calendarColors={calendarColors}
            onNavigate={setFocusedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Day View">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <Calendar
            view="day"
            focusedDate={focusedDate}
            selectedDate={selectedDate}
            events={events}
            calendarColors={calendarColors}
            onNavigate={setFocusedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="Agenda View">
        <div style={{ height: '500px', border: '1px solid rgb(var(--canvas-border))', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <Calendar
            view="agenda"
            focusedDate={focusedDate}
            selectedDate={selectedDate}
            events={events}
            calendarColors={calendarColors}
            onNavigate={setFocusedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      </ShowcaseSection>

      <ShowcaseSection label="MiniCalendar Sidebar">
        <DemoRow>
          <div style={{ maxWidth: '280px', width: '100%' }}>
            <MiniCalendar
              focusedDate={focusedDate}
              selectedDate={selectedDate}
              onSelect={(date) => {
                setFocusedDate(date)
                setSelectedDate(date)
              }}
              markers={events.map((e) => new Date(e.startDate))}
            />
          </div>
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Features">
        <ul style={{ fontSize: '13px', lineHeight: '1.8', color: 'rgb(var(--canvas-fg-1))' }}>
          <li>
            <strong>Multi-view support:</strong> Month, week, day, and agenda views for different planning needs
          </li>
          <li>
            <strong>Color-coded calendars:</strong> Multiple calendars with distinct colors for event organization
          </li>
          <li>
            <strong>Event rendering:</strong> Events displayed with calendar colors and selection highlighting
          </li>
          <li>
            <strong>Keyboard navigation:</strong> Arrow keys to navigate dates, pgup/pgdn for month changes
          </li>
          <li>
            <strong>Week start configuration:</strong> Configurable week start (Sunday or Monday)
          </li>
          <li>
            <strong>MiniCalendar:</strong> Compact sidebar calendar with date selection and event markers
          </li>
          <li>
            <strong>Date selection:</strong> Click to select dates with visual focus/selected states
          </li>
          <li>
            <strong>Event selection:</strong> Click events to select them with visual highlighting
          </li>
        </ul>
      </ShowcaseSection>

      <ShowcaseSection label="Calendar Props">
        <PropsTable>
          <PropRow name="view" type="CalendarView" description="Current view: 'month', 'week', 'day', or 'agenda'" required />
          <PropRow name="focusedDate" type="Date" description="The date that navigation is relative to" required />
          <PropRow name="selectedDate" type="Date | undefined" description="The currently selected date" />
          <PropRow name="events" type="CalendarEvent[]" description="Array of events to display" />
          <PropRow name="calendarColors" type="Record<string, string>" description="Mapping of calendar IDs to CSS colors" />
          <PropRow name="weekStartsOn" type="0 | 1" def="0" description="0 for Sunday, 1 for Monday" />
          <PropRow name="onChangeView" type="(view: CalendarView) => void" description="Fired when user changes the view" />
          <PropRow name="onNavigate" type="(date: Date) => void" description="Fired when user navigates to a new date" />
          <PropRow name="onSelectDate" type="(date: Date | undefined) => void" description="Fired when user selects/deselects a date" />
          <PropRow name="onSelectEvent" type="(eventId: string | null) => void" description="Fired when user selects/deselects an event" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="CalendarEvent Type">
        <PropsTable>
          <PropRow name="id" type="string" description="Unique event identifier" required />
          <PropRow name="title" type="string" description="Event title/name" required />
          <PropRow name="calendarId" type="string" description="ID of the calendar this event belongs to" required />
          <PropRow name="startDate" type="Date | string" description="Event start date" required />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="MiniCalendar Props">
        <PropsTable>
          <PropRow name="focusedDate" type="Date" description="The month/date to display" required />
          <PropRow name="selectedDate" type="Date | undefined" description="The currently selected date" />
          <PropRow name="weekStartsOn" type="0 | 1" def="0" description="0 for Sunday, 1 for Monday" />
          <PropRow name="onSelect" type="(date: Date) => void" description="Fired when user clicks a date" required />
          <PropRow name="markers" type="Date[]" description="Dates to mark as having events" />
        </PropsTable>
      </ShowcaseSection>

      <ShowcaseSection label="Keyboard Shortcuts">
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', fontSize: '13px', color: 'rgb(var(--canvas-fg-1))' }}>
          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>↑ / ↓ / ← / →</div>
          <div>Navigate between dates</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Page Up / Page Dn</div>
          <div>Navigate between months</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Home</div>
          <div>Jump to today</div>

          <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Enter / Space</div>
          <div>Select focused date</div>
        </div>
      </ShowcaseSection>
    </div>
  )
}
