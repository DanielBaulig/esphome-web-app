import useESPHomeWebEntityState from './useESPHomeWebEntityState';

import { button } from './ESPHomeWebButtonEntity.module.css';

export default function ESPHomeWebButtonEntity({entity}) {
  const state = useESPHomeWebEntityState(entity);

  return <fieldset className={button} onClick={() => entity.press()}>
    <legend>{state.name || entity.slug}</legend>
    <button>{state.name || entity.slug}</button>
  </fieldset>;
}
