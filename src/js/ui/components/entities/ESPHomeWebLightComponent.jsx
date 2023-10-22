import {useReducer, useEffect} from 'react';
import ESPHomeWebBrightnessInput from './inputs/ESPHomeWebBrightnessInput';
import ESPHomeWebRGBInput from './inputs/ESPHomeWebRGBInput';

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

  let colorControl = null;
  if (state.color_mode === 'rgb') {
    colorControl = <ESPHomeWebRGBInput 
      red={state.color.r} 
      green={state.color.g} 
      blue={state.color.b} 
      onChange={color => entity.turnOn({r: color.red, g: color.green, b: color.blue})}
    />;
  }

  let controls = null;
  if (state.state === 'ON') {
    controls = <>
      <ESPHomeWebBrightnessInput 
        value={state.brightness} 
        onChange={brightness => console.log('Change brightness!', brightness)}
      />
      {colorControl}
    </>;
  }

  return <div>
    {state.state}
    {controls}
    {stateControls}
  </div>;
}
