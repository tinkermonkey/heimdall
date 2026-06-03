import React, { useState } from 'react'
import './Avatar.css'
import type { StatusColor } from './statusColors'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg'
export type AvatarShape = 'circle' | 'rounded'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  src?: string
  size?: AvatarSize
  shape?: AvatarShape
  status?: StatusColor
  decorative?: boolean
}

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function getGradientHue(name: string): number {
  const hash = hashName(name)
  return hash % 360
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = 'md', shape = 'circle', status, decorative, className = '', style, ...props }, ref) => {
    const [imageError, setImageError] = useState(false)

    const initials = getInitials(name)
    const hue = getGradientHue(name)

    const showInitials = !src || imageError

    const classNames = [
      'avatar',
      `avatar--${size}`,
      `avatar--${shape}`,
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const initialsStyle = !showInitials ? { display: 'none' } : {
      background: `linear-gradient(135deg, hsl(${hue}, 85%, 55%), hsl(${hue}, 75%, 40%))`,
    }

    const imageStyle = showInitials ? { display: 'none' } : {}

    return (
      <div
        ref={ref}
        className={classNames}
        style={style}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : name}
        aria-hidden={decorative ? 'true' : undefined}
        {...props}
      >
        <div className="avatar__initials" style={initialsStyle}>
          {initials}
        </div>

        {src && (
          <img
            className="avatar__image"
            src={src}
            alt=""
            onError={() => setImageError(true)}
            style={imageStyle}
          />
        )}

        {status && (
          <div
            className={`avatar__status avatar__status--${status}`}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export default Avatar
