import EntityCard from '../EntityCard';
import NumberInput from './inputs/NumberInput';

import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';

export default function NumberEntity({entity}) {
  const state = useEntityState(entity);

  return <EntityCard title={getEntityLabel(state)}>
    <NumberInput
      type="number"
      value={state.state}
      onChange={v => entity.set(v)}
      min={state.min_value}
      max={state.max_value}
      step={state.step}
    />
  </EntityCard>;
}
