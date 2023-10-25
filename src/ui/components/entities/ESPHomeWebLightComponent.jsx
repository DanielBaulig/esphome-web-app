import ESPHomeWebBrightnessInput from './inputs/ESPHomeWebBrightnessInput';
import ESPHomeWebLightColorComponent from './ESPHomeWebLightColorComponent';
import useESPHomeWebEntityState from './useESPHomeWebEntityState';

import { splitEntityTypeAndName } from 'esphome-web';

import { 
  lightComponent, 
  brightness, 
  state as stateClass 
} from './ESPHomeWebLightComponent.module.css';

export default function ESPHomeWebLightComponent({
  entity,
}) {
  const state = useESPHomeWebEntityState(entity);

  const buttons = <>
    <button onClick={() => entity.turnOn()}>Turn on</button>
    <button onClick={() => entity.toggle()}>Toggle</button>
    <button onClick={() => entity.turnOff()}>Turn off</button>
  </>;

  let controls = null;
  if (state.state === 'ON') {
    controls = <>
      <li>
        <ESPHomeWebLightColorComponent 
          colorMode={state.color_mode} 
          colorTemp={state.color_temp} 
          color={state.color} 
          onTurnOn={entity.turnOn.bind(entity)}
        />
      </li>
      <li>
        <fieldset className={brightness}>
          <legend>Brightness</legend>
          <ESPHomeWebBrightnessInput 
            value={state.brightness} 
            onChange={value => entity.turnOn({brightness: value})}
          />
        </fieldset>
      </li>
    </>;
  }

  const [,id] = splitEntityTypeAndName(state.id);

  return <fieldset className={lightComponent}>
    <legend>{state.name || id}</legend>
    <ul>
      <li>
        <fieldset className={stateClass}>
          <legend>State</legend>
          <h3>{state.state}</h3>
          {buttons}
        </fieldset>
      </li>
      {controls}
    </ul>
  </fieldset>;
}
