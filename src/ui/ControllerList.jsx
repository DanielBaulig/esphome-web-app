import { useId, useEffect, useState, useReducer, lazy, Suspense } from 'react';
import { splitEntityTypeAndName } from 'esphome-web';
import ESPHomeWebLightComponent from './components/entities/ESPHomeWebLightComponent';
import ESPHomeWebEntityCard from './components/ESPHomeWebEntityCard';
import Spinner from './Spinner';
import { 
  controllerList, 
  listItem, 
  stateCard, 
  stateCardButtons, 
  stateCardSliders,
  hostName,
} from './ControllerList.module.css';

const lightId = 'light-neewer_660_rgb_light';

function getLightEntity(controller) {
  return controller.entities[lightId];
}

function getComponentForEntity(entity) {
  const [type,] = splitEntityTypeAndName(entity.id);
  switch (type) {
    case 'light':
      const ESPHomeWebLightComponent = lazy(() => import('./components/entities/ESPHomeWebLightComponent'));
      return <Suspense fallback={'Loading...'} key={entity.id}>
        <ESPHomeWebLightComponent entity={entity} />
      </Suspense>;
  }

  return null;
}

function ControllerCard({controller}) {
  const entities = controller.entities;
  const components = Object.values(entities).map(entity => getComponentForEntity(entity)).filter(c => !!c);

  return components;
}

function useController(controller) {
  function pullControllerState() {
    return {
      connected: controller.connected,
      connecting: controller.connecting,
    };
  }

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'disconnected':
        return { ...state, ...pullControllerState(), discovered: false };
      case 'connecting':
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
    }
    controller.addEventListener('entityupdate', onEntityUpdate);
    controller.addEventListener('connected', onConnected);
    return () => {
      controller.removeEventListener('connected', onConnected);
      controller.removeEventListener('entityupdate', onEntityUpdate);
    };
  }, [controller]);

  const actions = {
    connect() {
      controller.connect();
      dispatch({ type: 'connecting' });
    },
    disconnect() {
      controller.disconnect();
      dispatch({ type: 'disconnected' });
    },
    toggle() {
      if (state.connected || state.connecting) {
        actions.disconnect();
      } else {
        actions.connect();
      }
    },
  };

  return [state, actions];
}

function ControllerListItem({controller, onRemove}) {
  const [state, actions] = useController(controller);
  let card = null;
  if (state.connecting) {
    card = <Spinner />;
  } else if (state.connected) {
    card = <ControllerCard controller={controller} />;
  } 

  return <li className={listItem}>
    <header>
      <button className={hostName} onClick={() => actions.toggle()}><h3>{controller.host}</h3></button>
      <button onClick={onRemove}>&#x2716;</button>
    </header>
    <div>
      {card}
    </div>
  </li>;
}

export default function ControllerList({controllers, onRemoveController}) {
  return <ul className={controllerList}>
    {controllers.map(controller => <ControllerListItem controller={controller} key={controller.host} onRemove={() => onRemoveController(controller)} />)}
  </ul>;
}
