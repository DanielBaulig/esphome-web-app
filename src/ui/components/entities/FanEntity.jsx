import EntityCard from '../EntityCard';
import ToggleInput from './inputs/ToggleInput';
import RangeInput from './inputs/RangeInput';

import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';

import { speed, fan, speedFan } from './FanEntity.module.css'

export default function FanEntity({entity}) {
  const state = useEntityState(entity);
  const isOn = state.state === 'ON';
  const isSpeedFan = 'speed_level' in state;

  let speedInput;
  if (isOn && isSpeedFan) {
    speedInput =
      <li>
        <EntityCard title="Speed" className={speed}>
          <RangeInput
            min={1}
            max={state.speed_count}
            value={state.speed_level}
            onChange={(value) => entity.turnOn({speed_level: value})}
          />
        </EntityCard>
      </li>;
  }

  return <EntityCard title={getEntityLabel(state)} className={`${fan} ${isSpeedFan ? speedFan : ''}`}>
    <ul>
      <li>
        <ToggleInput
          checked={state.state === 'ON'}
          onChange={() => entity.toggle()}
        />
      </li>
      {speedInput}
    </ul>
  </EntityCard>;
}
