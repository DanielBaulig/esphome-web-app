import { header, menu, title } from './Header.module.css';

function Header({onAddController}) {
  return <header className={header}>
    <h1 className={title}>ESPHome Web</h1>
    <nav>
      <ul className={menu}>
        <li><button onClick={onAddController}><h3>+</h3></button></li>
      </ul>
    </nav>
  </header>;
}

export default Header;
