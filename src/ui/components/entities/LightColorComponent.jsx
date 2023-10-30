import {useState} from 'react';

import { colorComponent } from './LightColorComponent.module.css';

import ColorModeInput from './inputs/ColorModeInput';
import RGBInput from './inputs/RGBInput';
import ColorTemperatureInput from './inputs/ColorTemperatureInput';

export default function LightColorComponent({colorMode, color, colorTemp, onTurnOn}) {
  const [currentColorMode, setColorMode] = useState(colorMode);
  let colorControl = null;
  if (currentColorMode === 'rgb') {
    colorControl = <RGBInput 
      red={color.r || 0} 
      green={color.g || 0} 
      blue={color.b || 0} 
      onChange={color => onTurnOn({r: color.red, g: color.green, b: color.blue})}
    />;
  }
  if (currentColorMode === 'color_temp') {
    colorControl = <ColorTemperatureInput 
      value={colorTemp || 2400}
      onChange={value => onTurnOn({color_temp: value})}
    />;
  }

  return <fieldset className={colorComponent}>
    <legend>Color:
      <ColorModeInput colorMode={colorMode} onChange={(v) => {
        console.log('Color Mode', v);
        setColorMode(v)
      }}/>
    </legend>
    {colorControl}
  </fieldset>;
}
