import {useState} from 'react';

import { colorComponent } from './ESPHomeWebLightColorComponent.module.css';

import ESPHomeWebColorModeInput from './inputs/ESPHomeWebColorModeInput';
import ESPHomeWebRGBInput from './inputs/ESPHomeWebRGBInput';
import ESPHomeWebColorTemperatureInput from './inputs/ESPHomeWebColorTemperatureInput';

export default function ESPHomeWebLightColorComponent({colorMode, color, colorTemp, onTurnOn}) {
  const [currentColorMode, setColorMode] = useState(colorMode);
  let colorControl = null;
  if (currentColorMode === 'rgb') {
    colorControl = <ESPHomeWebRGBInput 
      red={color.r || 0} 
      green={color.g || 0} 
      blue={color.b || 0} 
      onChange={color => onTurnOn({r: color.red, g: color.green, b: color.blue})}
    />;
  }
  if (currentColorMode === 'color_temp') {
    colorControl = <ESPHomeWebColorTemperatureInput 
      value={colorTemp || 2400}
      onChange={value => onTurnOn({color_temp: value})}
    />;
  }

  return <fieldset className={colorComponent}>
    <legend>Color:
      <ESPHomeWebColorModeInput colorMode={colorMode} onChange={(v) => {
        console.log('Color Mode', v);
        setColorMode(v)
      }}/>
    </legend>
    {colorControl}
  </fieldset>;
}
