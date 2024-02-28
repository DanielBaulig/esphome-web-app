import EntityCard from '../EntityCard';
import ResponsiveInput from './inputs/ResponsiveInput';

import useEntityState from './useEntityState';
import getEntityLabel from './getEntityLabel';

import { useMemo } from 'react';

import { input } from './TextEntity.module.css';

const MODE_TEXT = 0;
const MODE_PASSWORD = 1;

export default function TextEntity({entity}) {
  const state = useEntityState(entity);
  const rx = useMemo(() => RegExp(state.pattern), [state.pattern]);

  return <EntityCard title={getEntityLabel(state)}>
    <ResponsiveInput
      type={state.mode === MODE_PASSWORD ? 'password' : 'text'}
      className={input}
      value={state.value}
      onChange={v => {
        if (!v.match(rx)) {
          return;
        }

        entity.set(v);
      }}
      minLength={state.min_length}
      maxLength={state.max_length}
      pattern={state.pattern ? state.pattern : undefined}
    />
  </EntityCard>;
}
