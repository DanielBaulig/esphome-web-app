import {useReducer, useEffect} from 'react';
import ESPHomeWebBrightnessInput from './inputs/ESPHomeWebBrightnessInput';
import ESPHomeWebLightColorComponent from './ESPHomeWebLightColorComponent';

import { lightComponent } from './ESPHomeWebLightComponent.module.css';

function useESPHomeWebEntityState(entity) {
  const [state, dispatch] = useReducer((state, action) => {
    switch(action.type) {
      case 'update': 
        return { ...state, ...action.state };
    }
    throw new Error(`Invalid action type ${action.type}.`);
  }, entity.data);
  useEffect(() => {
    const listener = (event) => {
      dispatch({type: 'update', state: entity.data});
    }
    entity.addEventListener('update', listener);
    return () => {
      entity.removeEventListener('update', listener);
    };
  }, [entity]);

  return state;
}

export default function ESPHomeWebLightComponent({
  entity,
}) {
  const state = useESPHomeWebEntityState(entity);
  const stateControls = <>
    <button>Turn on</button>
    <button>Toggle</button>
    <button>Turn off</button>
  </>;


  let controls = null;
  if (state.state === 'ON') {
    controls = <>
      <ESPHomeWebLightColorComponent 
        colorMode={state.color_mode} 
        colorTemp={state.color_temp} 
        color={state.color} 
        onTurnOn={entity.turnOn.bind(entity)}
      />
      <ESPHomeWebBrightnessInput 
        value={state.brightness} 
        onChange={value => entity.turnOn({brightness: value})}
      />
    </>;
  }

  return <ul className={lightComponent}>
    <li>{state.state}</li>
    <li>{controls}</li>
    <li>{stateControls}</li>
  </ul>;
}
