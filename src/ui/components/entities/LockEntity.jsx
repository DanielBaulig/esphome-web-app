import EntityCard from '../EntityCard';
import EntitySection from '../EntitySection';

import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';
import iif from '../../../iif';

import { useState, useEffect } from 'react';
import { state as stateClass } from './LockEntity.module.css';

export default function LockEntity({entity}) {
  const state = useEntityState(entity);

  const buttons = <>
    <button onClick={() => entity.unlock()}>Unlock</button>
    {iif(state.supports_open, <button onClick={() => entity.open()}>Open</button>)}
    <button onClick={() => entity.lock()}>Lock</button>
  </>;

  return <EntityCard title={getEntityLabel(state)}>
    <h3 className={stateClass}>{state.state}</h3>
    {buttons}
  </EntityCard>;
}
