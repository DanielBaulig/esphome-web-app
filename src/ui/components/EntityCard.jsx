import { entityCard } from './EntityCard.module.css';

export default function EntityCard({children}) {
  return <div className={entityCard}>
    {children}
  </div>
}
