import { CSSTransition } from 'react-transition-group';
import { useRef } from 'react';

import {drawer, content} from './Drawer.module.css';

export default function Drawer({open, onDoneClosing, className, children}) {
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
    unmountOnExit={true}
    mountOnEnter={true}
  >
    <div className={`${className} ${drawer}`} ref={wrapperRef}>
      <div className={content}>
        {children}
      </div>
    </div>
  </CSSTransition>;
}


