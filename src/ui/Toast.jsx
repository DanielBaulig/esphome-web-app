import Drawer from './Drawer';

import { useRef } from 'react';

import  { toast, content, warning } from './Toast.module.css';

const styles = {
  "warning": warning,
};

export default function Toast({visible, style, children}) {
  return <Drawer
      className={`${toast} ${styles[style]}`}
      open={visible}
  >
    <div className={content}>{children}</div>
  </Drawer>;
}
