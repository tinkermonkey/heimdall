import React, { useCallback } from 'react';
import { Icon } from './Icon';
import './GraphCollapseControl.css';

export interface GraphCollapseControlProps {
  nodeId: string;
  label: string;
  collapsed: boolean;
  hiddenDescendantCount: number;
  onToggleCollapse: () => void;
  /** World-space x coordinate (center of node) */
  x: number;
  /** World-space y coordinate (top of node) */
  y: number;
  /** Node width for positioning offset */
  nodeWidth: number;
  /** Node height for vertical centering */
  nodeHeight: number;
}

const CONTROL_SIZE = 24;
const CONTROL_OFFSET = 4;

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
      x,
      y,
      nodeWidth,
      nodeHeight,
    },
    ref,
  ) => {
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

    // Position at the right edge of the node, vertically centered
    // x, y are the center of the node, so:
    // - controlX places the foreignObject at the right edge (center_x + half_width + offset)
    // - controlY centers the 24px control vertically (center_y - half_control_size)
    const controlX = x + nodeWidth / 2 + CONTROL_OFFSET;
    const controlY = y - CONTROL_SIZE / 2;

    return (
      <foreignObject
        x={controlX}
        y={controlY}
        width={CONTROL_SIZE}
        height={CONTROL_SIZE}
        overflow="visible"
        className="graph-collapse-control-container"
      >
        <button
          ref={ref}
          type="button"
          className="graph-collapse-control"
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
      </foreignObject>
    );
  },
);

GraphCollapseControl.displayName = 'GraphCollapseControl';

export default GraphCollapseControl;
