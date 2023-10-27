
import useESPHomeWebEntityState from './useESPHomeWebEntityState';

import { select } from './ESPHomeWebSelectEntity.module.css';

export default function ESPHomeWebSelectEntity({entity}) {
  const state = useESPHomeWebEntityState(entity);

  return <fieldset className={select}>
    <legend>{state.name || entity.slug}</legend>
    <select onChange={(e) => entity.set(e.target.value)} value={state.state}>
      {state.option.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </fieldset>;
}
