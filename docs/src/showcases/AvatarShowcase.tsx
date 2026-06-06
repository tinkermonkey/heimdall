import { Avatar } from '@tinkermonkey/heimdall-ui'
import { PageHeader, ShowcaseSection, DemoRow, PropsTable, PropRow } from '../components/ShowcaseSection'

export function AvatarShowcase() {
  const imageUrl = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop'

  return (
    <div>
      <PageHeader name="Avatar" description="People-identifier primitive. Renders a person's photo or deterministic initials gradient with optional presence dot." />
      <ShowcaseSection label="All Sizes">
        <DemoRow gap={20}>
          <Avatar name="Ada Lovelace" size="xs" />
          <Avatar name="Ada Lovelace" size="sm" />
          <Avatar name="Ada Lovelace" size="md" />
          <Avatar name="Ada Lovelace" size="lg" />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Both Shapes">
        <DemoRow gap={20}>
          <Avatar name="Grace Hopper" size="md" shape="circle" />
          <Avatar name="Katherine Johnson" size="md" shape="rounded" />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Deterministic Gradients" description="Same name produces the same gradient color every time.">
        <DemoRow gap={20}>
          <Avatar name="Ada Lovelace" size="lg" />
          <Avatar name="Ada Lovelace" size="lg" />
          <Avatar name="Grace Hopper" size="lg" />
          <Avatar name="Grace Hopper" size="lg" />
          <Avatar name="Alan Turing" size="lg" />
          <Avatar name="Alan Turing" size="lg" />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Image with Fallback">
        <DemoRow gap={20}>
          <Avatar name="Ada Lovelace" size="md" src={imageUrl} />
          <Avatar name="Grace Hopper" size="md" src="https://invalid-url.com/image.jpg" />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="With Status Indicators">
        <DemoRow gap={20}>
          <Avatar name="Ada Lovelace" size="md" status="emerald" />
          <Avatar name="Grace Hopper" size="md" status="amber" />
          <Avatar name="Alan Turing" size="md" status="rose" />
          <Avatar name="Katherine Johnson" size="md" status="cyan" />
          <Avatar name="Another User" size="md" status="violet" />
          <Avatar name="Test User" size="md" status="neutral" />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Status with All Sizes">
        <DemoRow gap={20}>
          <Avatar name="Ada Lovelace" size="xs" status="emerald" />
          <Avatar name="Grace Hopper" size="sm" status="amber" />
          <Avatar name="Alan Turing" size="md" status="rose" />
          <Avatar name="Katherine Johnson" size="lg" status="cyan" />
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Decorative Avatar">
        <DemoRow gap={20}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Avatar name="Ada Lovelace" size="md" decorative />
            <span>Ada Lovelace</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Avatar name="Grace Hopper" size="md" decorative status="emerald" />
            <span>Grace Hopper</span>
          </div>
        </DemoRow>
      </ShowcaseSection>

      <ShowcaseSection label="Props">
        <PropsTable>
          <PropRow name="name" type="string" description="Person's full name for initials and deterministic gradient" required />
          <PropRow name="src" type="string" description="Image URL; falls back to initials on error" />
          <PropRow name="size" type="AvatarSize" def="md" description="xs (20px), sm (28px), md (36px), lg (64px)" />
          <PropRow name="shape" type="AvatarShape" def="circle" description="circle or rounded" />
          <PropRow name="status" type="StatusColor" description="Presence indicator: emerald, amber, rose, cyan, violet, neutral" />
          <PropRow name="decorative" type="boolean" description="When true, sets aria-hidden=true for context-only avatars" />
        </PropsTable>
      </ShowcaseSection>
    </div>
  )
}

