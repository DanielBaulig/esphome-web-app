import useESPHomeWebEntityState from './useESPHomeWebEntityState';

import { binarySensor } from './ESPHomeWebBinarySensorEntity.module.css';

export default function ESPHomeWebBinarySensorEntity({entity}) {
  const state = useESPHomeWebEntityState(entity);

  return <fieldset className={binarySensor}>
    <legend>{state.name || entity.slug}</legend>
    <h3>{state.state}</h3>
  </fieldset>;
}
