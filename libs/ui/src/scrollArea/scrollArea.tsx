"use client";

import { ComponentProps, forwardRef } from 'react';
import {
  OverlayScrollbarsComponent,
  OverlayScrollbarsComponentRef,
} from 'overlayscrollbars-react';
import 'overlayscrollbars/overlayscrollbars.css';

export interface OverlayScrollbarProps
  extends Omit<ComponentProps<'div'>, 'ref'> {}

/**
 * Scrollbar component
 */
const OverlayScrollbar = forwardRef<
  OverlayScrollbarsComponentRef<'div'>,
  OverlayScrollbarProps
>(function OverlayScrollbar({ ...rest }, ref) {
  return (
    <OverlayScrollbarsComponent
      ref={ref}
      options={{
        scrollbars: {
          autoHide: 'leave',
          autoHideDelay: 1000,
        },
        showNativeOverlaidScrollbars: true,
      }}
      {...rest}
      defer
    />
  );
});

export default OverlayScrollbar;