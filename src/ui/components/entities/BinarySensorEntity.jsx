import useEntityState from './useEntityState';

import { binarySensor } from './BinarySensorEntity.module.css';

export default function BinarySensorEntity({entity}) {
  const state = useEntityState(entity);

  return <fieldset className={binarySensor}>
    <legend>{state.name || entity.slug}</legend>
    <h3>{state.state}</h3>
  </fieldset>;
}
