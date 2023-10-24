import { entityCard } from './ESPHomeWebEntityCard.module.css';

export default function ESPHomeWebEntityCard({children}) {
  return <div className={entityCard}>
    {children}
  </div>
}
