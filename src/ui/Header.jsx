import Icon from '@mdi/react';
import { mdiPlus } from '@mdi/js';

import { header, menu, title as titleClass } from './Header.module.css';

import { title } from '../config';

function Header({onAddController}) {
  return <header className={header}>
    <h1 className={titleClass}>{title}</h1>
    <nav>
      <ul className={menu}>
        <li><button onClick={onAddController}>
          <Icon path={mdiPlus}
            size={1}
          />
       </button></li>
      </ul>
    </nav>
  </header>;
}

export default Header;
