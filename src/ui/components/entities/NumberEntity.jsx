import EntityCard from '../EntityCard';
import ResponsiveInput from './inputs/ResponsiveInput';

import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';

import { number } from './NumberEntity.module.css';

export default function NumberEntity({entity}) {
  const state = useEntityState(entity);

  return <EntityCard title={getEntityLabel(state)} className={number}>
    <ResponsiveInput 
      type="number" 
      value={state.state}
      onChange={v => console.log('change', v)}
    />
  </EntityCard>;
}
