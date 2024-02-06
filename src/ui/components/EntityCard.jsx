import { entityCard } from './EntityCard.module.css';

export default function EntityCard({title, onClick, className, children}) {
  return <fieldset className={`${entityCard} ${className}`} onClick={onClick}>
      <legend>{title}</legend>
      {children}
  </fieldset>;
}
