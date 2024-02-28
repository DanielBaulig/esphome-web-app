import Drawer from '../Drawer';

import { useReducer, useState, useEffect, useCallback, useRef } from 'react';

import { drawer, card, header, title as titleClass } from './DrawerCard.module.css';

function DrawerCardHeader({title, glyph, onToggleDrawer, onMouseDown, children}) {
  return <header className={header}>{glyph}
    <button 
      className={titleClass} 
      tabIndex={0} 
      onClick={onToggleDrawer}
      onMouseDown={onMouseDown}
    >
      <h3>{title}</h3>
    </button>
    {children}
  </header>;
}

export default function DrawerCard({open, glyph, onToggleDrawer, onBeginOpening, onDoneClosing, title, menu, children, onDragStart, onDragEnd}) {
  const [{closing, closed}, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'finishClosing':
        return {closing: false, closed: true};
      case 'beginClosing':
        return {closing: true, closed: false}
      case 'beginOpening':
        return {closing: false, closed: false}
    }
    throw new Error('Invalid action type');
  }, {closing: false, closed: !open});

  // Allow for "uncontrolled" use of DrawerCard
  // Basically functions like input controlled/uncontrolled
  // If a onToggleDrawer callback is provided, it is responsible
  // for switching the open state on DrawerCard, otherwise DrawerCard
  // will use open just for initial rendering and will manage the
  // drawer open/close state internally.
  const [uncontrolledOpen, setUncontrolledOpen] = useState(open);
  const onUncontrolledToggleDrawer = useCallback(() => setUncontrolledOpen((state) => !state));
  if (!onToggleDrawer) {
    onToggleDrawer = onUncontrolledToggleDrawer;
    open = uncontrolledOpen;
  }
  const [isDraggable, setDraggable] = useState(false);
  const [dragging, setDragging] = useState(false);
  const draggableRef = useRef(null);

  useEffect(() => {
    if (open) {
      onBeginOpening?.();
      dispatch({ type: 'beginOpening' });
    } else if (!closed) {
      dispatch({ type: 'beginClosing' });
    }
  }, [open]);

  return <div 
    className={card} 
    draggable={isDraggable}
    onDragStart={(event) => {
      setDragging(true)
      onDragStart(event)
    }}
    onDragEnd={(event) => {
      setDragging(false);
      onDragEnd(event)
    }}
  >
    <DrawerCardHeader
      glyph={glyph}
      title={title}
      onToggleDrawer={onToggleDrawer}
      onMouseDown={() => setDraggable(true)}
    >
      {menu}
    </DrawerCardHeader>
    <Drawer
      className={drawer}
      open={open && ! closing}
      onDoneClosing={() => {
        onDoneClosing?.();
        dispatch({type: 'finishClosing'});
      }}
    >
      {children}
    </Drawer>
  </div>;
}
