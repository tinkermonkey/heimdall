import React, { useCallback, useRef } from 'react';
import { Icon } from './Icon';
import './GraphCollapseControl.css';

export interface GraphCollapseControlProps {
  nodeId: string;
  label: string;
  collapsed: boolean;
  hiddenDescendantCount: number;
  onToggleCollapse: () => void;
  /** Position in screen space */
  screenX: number;
  screenY: number;
}

export const GraphCollapseControl = React.forwardRef<
  HTMLButtonElement,
  GraphCollapseControlProps
>(
  (
    {
      nodeId,
      label,
      collapsed,
      hiddenDescendantCount,
      onToggleCollapse,
      screenX,
      screenY,
    },
    ref,
  ) => {
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onToggleCollapse();
      },
      [onToggleCollapse],
    );

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onToggleCollapse();
        }
      },
      [onToggleCollapse],
    );

    const accessibleLabel = `${collapsed ? 'Expand' : 'Collapse'} ${label}`;

    React.useImperativeHandle(ref, () => buttonRef.current!);

    return (
      <button
        ref={buttonRef}
        type="button"
        className="graph-collapse-control"
        style={{
          left: `${screenX}px`,
          top: `${screenY}px`,
        } as React.CSSProperties}
        aria-label={accessibleLabel}
        aria-expanded={!collapsed}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        data-testid={`graph-collapse-control-${nodeId}`}
      >
        {collapsed && hiddenDescendantCount > 0 && (
          <span className="graph-collapse-control__badge">
            {hiddenDescendantCount}
          </span>
        )}
        <Icon
          name={collapsed ? 'chevronRight' : 'chevronDown'}
          size={12}
        />
      </button>
    );
  },
);

GraphCollapseControl.displayName = 'GraphCollapseControl';

export default GraphCollapseControl;
