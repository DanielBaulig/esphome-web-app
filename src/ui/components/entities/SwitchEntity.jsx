import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel.js';


import ToggleInput from './inputs/ToggleInput';
import EntityCard from '../EntityCard';

import { switchEntity } from './SwitchEntity.module.css';

export default function SwitchEntity({entity}) {
  const state = useEntityState(entity);

  return <EntityCard title={getEntityLabel(state)} className={switchEntity}>
    <div>
      <ToggleInput checked={state.state === 'ON'} onChange={() => entity.toggle()} />
    </div>
  </EntityCard>;
}
