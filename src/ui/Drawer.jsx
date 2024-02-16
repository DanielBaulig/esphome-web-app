import { CSSTransition } from 'react-transition-group';
import { useRef } from 'react';

import {drawer, content, vertical, horizontal} from './Drawer.module.css';

const directions = {
  vertical: vertical,
  horizontal: horizontal,
};

export default function Drawer({open, onDoneClosing, onDoneOpening, className, direction = 'vertical', children}) {
  const wrapperRef = useRef(null);
  return <CSSTransition
    nodeRef={wrapperRef}
    in={open}
    classNames={"animation"}
    addEndListener={(done) => {
      wrapperRef.current.addEventListener('transitionend', done, false);
    }}
    timeout={1200}
    appear={true}
    onExited={onDoneClosing}
    onEntered={onDoneOpening}
    unmountOnExit={true}
    mountOnEnter={true}
  >
    <div className={`${className} ${drawer} ${directions[direction]}`} ref={wrapperRef}>
      <div className={content}>
        {children}
      </div>
    </div>
  </CSSTransition>;
}


