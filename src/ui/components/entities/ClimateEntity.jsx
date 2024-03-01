import EntityCard from '../EntityCard';
import NumberInput from './inputs/NumberInput';
import EntitySection from '../EntitySection';
import DropDownInput from './inputs/DropDownInput';

import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';

import css from '../../css';
import iif from '../../../iif';
import { flex, flexFill } from '../../utility.module.css';

function HeatCoolControls({state, onLowChange, onHighChange}) {
  return (<>
    <NumberInput
      value={state.target_temperature_low}
      max={state.max_temp}
      min={state.min_temp}
      step={state.step}
      onChange={onLowChange}
    />
    <NumberInput
      value={state.target_temperature_high}
      max={state.max_temp}
      min={state.min_temp}
      step={state.step}
      onChange={onHighChange}
    />
  </>);
}

function HeatControls({state, onChange}) {
  const heatSetPoint = iif(
    'target_temperature' in state,
    state.target_temperature,
    state.target_temperature_low
  );
  return (
    <NumberInput
      value={heatSetPoint}
      max={state.max_temp}
      min={state.min_temp}
      step={state.step}
      onChange={onChange}
    />
  );
}

function CoolControls({state, onChange}) {
  const coolSetPoint = iif(
    'target_temperature' in state,
    state.target_temperature,
    state.target_temperature_high
  );
  return (
    <NumberInput
      value={coolSetPoint}
      max={state.max_temp}
      min={state.min_temp}
      step={state.step}
      onChange={onChange}
    />
  );
}

export default function ClimateEntity({entity}) {
  const state = useEntityState(entity);

  const onLowChange = iif(
    'target_temperature' in state,
    (target_temperature) => entity.set({target_temperature}),
    (target_temperature_low) => entity.set({target_temperature_low}),
  );

  const onHighChange = iif(
    'target_temperature' in state,
    (target_temperature) => entity.set({target_temperature}),
    (target_temperature_high) => entity.set({target_temperature_high}),
  );

  let controls = <>
    <EntitySection title="Control">
      <DropDownInput
        className={css(flex, flexFill)}
        value={state.mode}
        options={state.modes}
        onChange={(event) => entity.set({mode: event.target.value})}
      />
      {iif(
        state.mode === 'HEAT_COOL',
        <HeatCoolControls
          state={state}
          onLowChange={onLowChange}
          onHighChange={onHighChange}
        />
      )}
      {iif(
        state.mode === 'HEAT',
        <HeatControls state={state} onChange={onLowChange} />
      )}
      {iif(
        state.mode === 'COOL',
        <CoolControls state={state} onChange={onHighChange} />
      )}
    </EntitySection>
  </>;

  return (
    <EntityCard title={getEntityLabel(state)}>
      <EntitySection title="State">
        <h3 className={css(flex, flexFill)}>{state.state}</h3>
        <div>
          <span>Current Temperature</span>
          <h3 className={flex}>{state.current_temperature}</h3>
        </div>
      </EntitySection>
      {controls}
    </EntityCard>
  );
}


