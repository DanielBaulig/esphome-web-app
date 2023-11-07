import useEntityState from './useEntityState';

import { stateEntity } from './StateEntity.module.css';

export default function StateEntity({entity}) {
  const state = useEntityState(entity);

  return <fieldset className={stateEntity}>
    <legend>{state.name || entity.slug}</legend>
    <h3>{state.state}</h3>
  </fieldset>;
}

