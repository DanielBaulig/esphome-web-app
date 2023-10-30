import BrightnessInput from './inputs/BrightnessInput';
import LightColorComponent from './LightColorComponent';
import useEntityState from './useEntityState';

import { 
  lightComponent, 
  brightness, 
  state as stateClass 
} from './LightComponent.module.css';

export default function LightComponent({
  entity,
}) {
  const state = useEntityState(entity);

  const buttons = <>
    <button onClick={() => entity.turnOn()}>Turn on</button>
    <button onClick={() => entity.toggle()}>Toggle</button>
    <button onClick={() => entity.turnOff()}>Turn off</button>
  </>;

  let controls = null;
  if (state.state === 'ON') {
    controls = <>
      <li>
        <LightColorComponent 
          colorMode={state.color_mode} 
          colorTemp={state.color_temp} 
          color={state.color} 
          onTurnOn={entity.turnOn.bind(entity)}
        />
      </li>
      <li>
        <fieldset className={brightness}>
          <legend>Brightness</legend>
          <BrightnessInput 
            value={state.brightness} 
            onChange={value => entity.turnOn({brightness: value})}
          />
        </fieldset>
      </li>
    </>;
  }

  return <fieldset className={lightComponent}>
    <legend>{state.name || entity.slug}</legend>
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
