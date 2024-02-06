import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';
import EntityCard from '../EntityCard';


import { stateEntity } from './StateEntity.module.css';

export default function StateEntity({entity}) {
  const state = useEntityState(entity);

  return <EntityCard title={getEntityLabel(state)} className={stateEntity}>
    <h3>{state.state}</h3>
  </EntityCard>;
}

