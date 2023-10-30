
import useEntityState from './useEntityState';

import { select } from './SelectEntity.module.css';

export default function SelectEntity({entity}) {
  const state = useEntityState(entity);

  return <fieldset className={select}>
    <legend>{state.name || entity.slug}</legend>
    <select onChange={(e) => entity.set(e.target.value)} value={state.state}>
      {state.option.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </fieldset>;
}
