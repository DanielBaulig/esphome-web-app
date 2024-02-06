import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';

import EntityCard from '../EntityCard';

import { button } from './ButtonEntity.module.css';

export default function ButtonEntity({entity}) {
  const state = useEntityState(entity);
  const label = getEntityLabel(state);

  return <EntityCard
    title={label}
    className={button}
    onClick={() => entity.press()}
  >
    <button>{label}</button>
  </EntityCard>;
}
