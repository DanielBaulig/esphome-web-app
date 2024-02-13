import Drawer from '../Drawer';

import { useReducer, useState, useEffect, useCallback } from 'react';

import { drawer, card, header, title as titleClass } from './DrawerCard.module.css';

function DrawerCardHeader({title, onToggleDrawer, children}) {
  return <header className={header}>
    <button className={titleClass} tabIndex={0} onClick={onToggleDrawer}><h3>{title}</h3></button>
    {children}
  </header>;
}

export default function DrawerCard({open, onToggleDrawer, onBeginOpening, onDoneClosing, title, menu, children}) {
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

  useEffect(() => {
    if (open) {
      onBeginOpening();
      dispatch({ type: 'beginOpening' });
    } else if (!closed) {
      dispatch({ type: 'beginClosing' });
    }
  }, [open]);

  return <div className={card}>
    <DrawerCardHeader
      title={title}
      onToggleDrawer={onToggleDrawer}
    >
      {menu}
    </DrawerCardHeader>
    <Drawer
      className={drawer}
      open={open && ! closing}
      onDoneClosing={() => {
        onDoneClosing();
        dispatch({type: 'finishClosing'});
      }}
    >
      {children}
    </Drawer>
  </div>;
}
