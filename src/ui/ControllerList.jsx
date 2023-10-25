import { forwardRef, useId, useEffect, useState, useReducer, lazy, Suspense, useRef } from 'react';
import { splitEntityTypeAndName } from 'esphome-web';
import Spinner from './Spinner';
import { 
  controllerList, 
  listItem, 
  header,
  card,
} from './ControllerList.module.css';
import { CSSTransition } from 'react-transition-group';

import { filters } from '../../esphome-web.json';

const ESPHomeWebLightComponent = lazy(() => import('./components/entities/ESPHomeWebLightComponent'));

function getComponentForEntity(entity) {
  const [type,] = splitEntityTypeAndName(entity.id);
  switch (type) {
    case 'light':
      return <Suspense fallback={'Loading...'} key={entity.id}>
        <ESPHomeWebLightComponent entity={entity} />
      </Suspense>;
  }

  return null;
}

const initializedEntityFilters = filters.map(filter => {
  if (typeof filter !== 'object') {
    filter = { type: 'id', value: filter };
  }

  switch (filter.type) {
    case 'rx':
      const rx = RegExp(filter.value);
      return (entity) => rx.test(entity.id)
    case 'id':
      return (entity) => entity.id === filter.value;

  }

  throw new Error('Invalid filter');
});

function filterEntities(entity) {
  if (!initializedEntityFilters.length) {
    return true;
  }
  return initializedEntityFilters.some((filter) => filter(entity))
}

function ControllerHeader({host, onToggleController, onRemoveController}) {
  return <header className={header}>
    <button onClick={onToggleController}><h3>{host}</h3></button>
    <button onClick={onRemoveController}>&#x2716;</button>
  </header>;
}

function ControllerEntities({controller}) {
  const [,dispatch] = useReducer((state, action) => {
    switch(action.type) {
      case 'update':
        return {};
    }
  }, {})
  useEffect(() => {
    function onEntityUpdate() {
      dispatch({type: 'update'});
    }
    controller.addEventListener('entityupdate', onEntityUpdate);
    return () => {
      controller.removeEventListener('entityupdate', onEntityUpdate);
    };
  }, [controller]);
  const entities = Object.values(controller.entities).filter(filterEntities);
  const components = entities.map(entity => getComponentForEntity(entity)).filter(c => !!c);
  console.log('render entities', Object.keys(controller.entities));

  return components;
}

const ControllerCard = forwardRef(function ControllerCard({children}, ref) {
  return <div className={card} ref={ref}>
    {children}
  </div>;
});

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
  const [showCard, setShowCard] = useState(state.connecting || state.connected);
  const cardRef = useRef(null);

  let cardContent = null;
  if (state.connecting) {
    console.log('Render spinner');
    cardContent = <Spinner />;
  } else if (state.connected) {
    console.log('Render entities');
    cardContent = <ControllerEntities controller={controller} />;
  } 

  return <li className={listItem}>
    <ControllerHeader 
      host={controller.host}
      onRemoveController={onRemove}
      onToggleController={() => {
        if (showCard) {
          setShowCard(false);
        } else {
          actions.connect();
          setShowCard(true);
        }
      }}
    />
    <CSSTransition nodeRef={cardRef} in={showCard} classNames={"fade"} timeout={1000} appear={true} onExited={() => actions.disconnect()}>
      <ControllerCard ref={cardRef}>
        <div>
          {cardContent}
        </div>
      </ControllerCard>
    </CSSTransition>
  </li>;
}

export default function ControllerList({controllers, onRemoveController}) {
  return <ul className={controllerList}>
    {controllers.map(controller => <ControllerListItem controller={controller} key={controller.host} onRemove={() => onRemoveController(controller)} />)}
  </ul>;
}
