import { useId, useEffect, useState, useReducer } from 'react';
import ESPHomeWebLightComponent from './components/entities/ESPHomeWebLightComponent';
import ESPHomeWebEntityCard from './components/ESPHomeWebEntityCard';
import { 
  controllerList, 
  listItem, 
  stateCard, 
  stateCardButtons, 
  stateCardSliders,
  hostName,
} from '../../css/ControllerList.module.css';

const lightId = 'light-neewer_660_rgb_light';

function getLightEntity(controller) {
  return controller.entities[lightId];
}


function hexToRGB(hex) {
  const parts = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: parseInt(parts[1], 16),
    g: parseInt(parts[2], 16),
    b: parseInt(parts[3], 16),
  };
}

function useLightEntityReducer(entity) {
  const controller = entity.controller;
  const [state, dispatch] = useReducer((state, action) => {
    let pendingUpdate = false;
    switch (action.type) {
      case 'update':
        return {...state, ...action.state};
      case 'color': 
        const rgb = hexToRGB(action.value);
        entity.turnOn(rgb);
        return {...state, color: rgb };
      case 'brightness':
        if (!state.suspendUpdates) {
          entity.turnOn({brightness: action.value });
        } else {
          pendingUpdate = 'brightness';
        }
        return {...state, brightness: action.value, pendingUpdate };
      case 'colortemp':
        if (!state.suspendUpdates) {
          entity.turnOn({color_temp: action.value });
        } else {
          pendingUpdate = 'colortemp';
        }
        return {...state, color_temp: action.value, pendingUpdate };
      case 'mousedown':
        return {...state, suspendUpdates: true, pendingUpdate: false };
      case 'mouseup':
        switch (state.pendingUpdate) {
          case 'brightness':
            entity.turnOn({brightness: state.brightness});
            break;
          case 'colortemp':
            entity.turnOn({color_temp: state.color_temp});
            break;
        }
        return {...state, suspendUpdates: false, pendingUpdate: false };
    }
  }, entity.data);
  useEffect(() => {
    const listener = (event) => {
      if (event.detail.entity.id != entity.id) {
        return;
      }
      dispatch({type: 'update', state: event.detail.entity.data});
    }
    controller.addEventListener('entityupdate', listener);
    return () => controller.removeEventListener('entityupdate', listener)
  }, [controller, entity]);

  return [state, dispatch];
}

function rgbToHex(color) {
  function pad(color) {
    const hex = color.toString(16)
    return `${hex.length == 1 ? '0' : ''}{hex}`;
  }
  if (!('r' in color && 'g' in color && 'b' in color)) {
    return '#000000';
  }
  return `#${color.r.toString(16)}${color.g.toString(16)}${color.b.toString(16)}`;
}

function ControllerCard({controller}) {
  const entity = getLightEntity(controller);
  const [state, dispatch] = useLightEntityReducer(entity);

  // color_temp is given in Mireds
  const colorTempKelvin = 1000000 / state.color_temp;
  const brightnessId = useId();
  const colorTempId = useId();
  const colorId = useId();
  
  return <ESPHomeWebLightComponent 
    entity={entity}
  />


  let detailControls = null;
  if (state.state == 'ON') {
    detailControls = <>
      <div className={stateCardSliders}>
        <label htmlFor={colorId}>Color</label>
        <input 
          id={colorId} 
          type="color" 
          onChange={
            (event) => dispatch({type: 'color', value: event.target.value})
          }
          value={rgbToHex(state.color)}
        />
        <label htmlFor={brightnessId}>Brightness</label>
        <input 
          id={brightnessId} 
          type="range" 
          min="0" 
          max="100" 
          value={state.brightness} 
          onChange={
            (event) => dispatch({type: 'brightness', value: event.target.value})
          } 
          onMouseDown={() => dispatch({type:'mousedown'})} 
          onMouseUp={() => dispatch({type: 'mouseup'})} 
        />
        <label htmlFor={colorTempId}>Color Temperature</label>
        <input 
          id={colorTempId} 
          type="range" 
          min="2000" 
          max="6500" 
          value={colorTempKelvin} 
          onChange={(event) => {
            const colorTempMireds = 1000000 / event.target.value;
            dispatch(
              {type: 'colortemp', value: colorTempMireds}
            )
          }}
          onMouseDown={() => dispatch({type: 'mousedown'})}
          onMouseUp={() => dispatch({type: 'mouseup'})}
        />
      </div>
    </>;
  }
  
  return <div className={stateCard}>
    <div>{state.state}</div>
    {detailControls}
    <div className={stateCardButtons}>
      <button onClick={() => getLightEntity(controller).turnOn()}>Turn On</button>
      <button onClick={() => getLightEntity(controller).toggle()}>Toggle</button>
      <button onClick={() => getLightEntity(controller).turnOff()}>Turn Off</button>
    </div>
  </div>;
}

function useControllerReducer(controller) {
  function pullControllerState() {
    return {
      connected: controller.connected,
      connecting: controller.connecting,
      discovering: lightId in controller.entities,
    };
  }

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'discovered':
        return { ...state, discovered: true };
      case 'disconnect':
        controller.disconnect();
        return { ...state, ...pullControllerState(), discovered: false };
      case 'connect':
        controller.connect();
        return { ...state, ...pullControllerState() };
      case 'connected':
        return { ...state, ...pullControllerState() };
    }
  }, { ...pullControllerState(), discovered: false });

  useEffect(() => {
    const onConnected = () => {
      dispatch({type: 'connected'});
    }
    const onEntityUpdate = (event) => {
      if (event.detail.entity.id == lightId) {
        dispatch({type: 'discovered'});
      }
    }
    controller.addEventListener('entityupdate', onEntityUpdate);
    controller.addEventListener('connected', onConnected);
    return () => {
      controller.removeEventListener('connected', onConnected);
      controller.removeEventListener('entityupdate', onEntityUpdate);
    };
  }, [controller]);

  return [state, dispatch];
}

function ControllerListItem({controller, onRemove}) {
  const [state, dispatch] = useControllerReducer(controller);
  let card = null;
  if (state.connecting) {
    card = <div>Connecting...</div>;
  } else if (state.discovered) {
    // card = <ControllerCard controller={controller} />;
    card = <ControllerCard controller={controller} />;
  } else if (state.connected) {
    card = <div>Discovering NW660...</div>;
  }
  const toggleConnection = () => {
    if (state.connected || state.connecting) {
      dispatch({type: 'disconnect'});
    } else {
      dispatch({type: 'connect'});
    }
  };
  return <li className={listItem}>
    <header>
      <button className={hostName} onClick={toggleConnection}><h3>{controller.host}</h3></button>
      <button onClick={onRemove}>Remove</button>
    </header>
    {card}
  </li>;
}

function ControllerList({controllers, onRemoveController}) {
  return <ul className={controllerList}>
    {controllers.map(controller => <ControllerListItem controller={controller} key={controller.host} onRemove={() => onRemoveController(controller)} />)}
  </ul>;
}

export default ControllerList;
