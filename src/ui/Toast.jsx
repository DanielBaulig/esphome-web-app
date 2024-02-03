import { CSSTransition } from  'react-transition-group';
import  { toast, content } from './Toast.module.css';
import { useRef } from 'react';

export default function Toast({visible, children}) {
  const nodeRef = useRef(null)
  return <CSSTransition
      in={visible}
      nodeRef={nodeRef}
      classNames="transition"
      unmountOnExit
      timeout={400}>
    <div ref={nodeRef} className={toast}>
      <div className={content}>{children}</div>
    </div>
  </CSSTransition>;
}
