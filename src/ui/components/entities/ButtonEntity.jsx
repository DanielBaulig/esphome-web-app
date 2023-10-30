import useEntityState from './useEntityState';

import { button } from './ButtonEntity.module.css';

export default function ButtonEntity({entity}) {
  const state = useEntityState(entity);

  return <fieldset className={button} onClick={() => entity.press()}>
    <legend>{state.name || entity.slug}</legend>
    <button>{state.name || entity.slug}</button>
  </fieldset>;
}
