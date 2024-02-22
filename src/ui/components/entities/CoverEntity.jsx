import EntityCard from '../EntityCard';
import EntitySection from '../EntitySection';
import RangeInput from './inputs/RangeInput';

import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';

import { useState, useEffect } from 'react';
import { tilt, position, state as stateClass } from './CoverEntity.module.css';

export default function CoverEntity({entity}) {
  const state = useEntityState(entity);
  const [seenPositionTrait, setSeenPositionTrait] = useState(0 < state.value && state.value < 1);

  const currentState = state.current_operation !== 'IDLE' ?
    state.current_operation :
    state.state;

  useEffect(() => {
    if (seenPositionTrait) {
      return;
    }
    if (0 < state.position && state.position < 1) {
      setSeenPositionTrait(true);
    }
  }, [state.position]);

  const buttons = <>
    <button onClick={() => entity.open()}>Open</button>
    <button onClick={() => entity.stop()}>Stop</button>
    <button onClick={() => entity.close()}>Close</button>
  </>;

  let tiltControls;
  if ('tilt' in state) {
    tiltControls = <EntitySection title="Tilt">
      <RangeInput
        className={tilt}
        min={0}
        max={1}
        step={0.01}
        value={state.tilt}
        onChange={(tilt) => entity.set({tilt})}
      />
    </EntitySection>;
  }

  let positionControls;
  if ('position' in state || seenPositionTrait) {
    positionControls = <RangeInput
      className={position}
      value={state.value}
      step={0.01}
      min={0.0}
      max={1.0}
      onChange={(position) => entity.set({position})}
    />
  }

  return <EntityCard title={getEntityLabel(state)} className={stateClass}>
    <EntitySection title="State">
      <h3>{currentState}</h3>
      {positionControls}
      {buttons}
    </EntitySection>
    {tiltControls}
  </EntityCard>;
}
