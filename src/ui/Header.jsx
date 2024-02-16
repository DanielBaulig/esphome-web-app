import Icon from '@mdi/react';
import Drawer from './Drawer';
import SerialConnectButton from './SerialConnectButton';

import { mdiPlusThick, mdiWifiPlus, mdiUsb } from '@mdi/js';
import { useState, useId, useRef } from 'react';
import { drawer, header, menu, menuToggle, menuToggleLabel, title as titleClass } from './Header.module.css';

import { title } from '../config';

function Header({onAddController, onConnectSerial}) {
  // We want the menu items to be ordered in reverse
  // in their grid. I.e. the logically first item
  // should render on the right.
  // I tried using flex-direction: row-reverse first
  // but that caused issues with the 0fr -> 1fr animation
  // then going from right to left, instead of left to right.
  const order = ((i) => () => i = i - 1)(0);

  const [isMenuOpen, setMenuOpen] = useState(false);
  const id = useId();
  const checkBoxRef = useRef(null);

  // We'll remove the menu buttons from tab order while
  // the menu is closed
  const menuButtonTabIndex = isMenuOpen ? 0 : -1;

  return <header className={header}>
    <h1 className={titleClass}>{title}</h1>
    <nav className={menu} onBlur={(e) => {
      // Check if the new element receiving focus is still within
      // the nav menu.
      if (!e.currentTarget.contains(e.relatedTarget)) {
        // If not, close the menu
        setMenuOpen(false);
      }
    }}>
      <input
        type="checkbox"
        id={id}
        className={menuToggle}
        checked={isMenuOpen}
        onChange={(e) => setMenuOpen(e.target.checked)}
        // Safari won't focus the input with keyboard inteactions
        // if tabIndex isn't set
        tabIndex={0}
        ref={checkBoxRef}
      />
      <div className={drawer}>
        <ul className={menu}>
          <li onClick={onAddController} style={{order: order()}}>
            <button tabIndex={menuButtonTabIndex}>
              <Icon path={mdiWifiPlus}
                size={1}
              />
            </button>
          </li>
          <li onClick={onConnectSerial} style={{order: order()}}>
            <SerialConnectButton tabIndex={menuButtonTabIndex}>
              <Icon path={mdiUsb}
                size={1}
              />
            </SerialConnectButton>
          </li>
        </ul>
      </div>
      <label
        htmlFor={id}
        className={menuToggleLabel}
        // Negative tabIndex will remove the label from
        // tab order, but will allow it to receive focus
        // This way, during nav onBlur delegation, we can
        // see if the label was clicked (relatedTarget).
        tabIndex={-1}
        // We don't actually want to have focus on the label
        // though, so redirect focus back to the checkbox input.
        onFocus={() => checkBoxRef.current.focus()}
      >
        <Icon path={mdiPlusThick}
          size={1}
        />
      </label>
    </nav>
  </header>;
}

export default Header;
