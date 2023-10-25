import { memo, forwardRef, useId, useEffect, useState, useReducer, lazy, Suspense, useRef } from 'react';
import Spinner from './Spinner';
import { 
  controllerList, 
  listItem, 
  header,
  card,
  content,
} from './ControllerList.module.css';
import { CSSTransition } from 'react-transition-group';

import { filters } from '../../esphome-web.json';

const ESPHomeWebLightComponent = lazy(() => import('./components/entities/ESPHomeWebLightComponent'));
const ESPHomeWebBinarySensorEntity= lazy(() => import('./components/entities/ESPHomeWebBinarySensorEntity'));
const ESPHomeWebButtonEntity= lazy(() => import('./components/entities/ESPHomeWebButtonEntity'));

function getComponentForEntity(entity) {
  const loading = 'Loading...';
  switch (entity.type) {
    case 'light':
      return <Suspense fallback={loading} key={entity.id}>
        <ESPHomeWebLightComponent entity={entity} />
      </Suspense>;
    case 'binary_sensor':
      return <Suspense fallback={loading} key={entity.id}>
        <ESPHomeWebBinarySensorEntity entity={entity} />
      </Suspense>;
    case 'button':
      return <Suspense fallback={loading} key={entity.id}>
        <ESPHomeWebButtonEntity entity={entity} />
      </Suspense>;
  }

  return null;
}

function makeFilter(template) {
  if (typeof template !== 'object') {
    template = { type: 'id', value: filter };
  }

  switch (template.type) {
    case 'rx':
      const rx = RegExp(template.value);
      return (controller, entity) => rx.test(entity.id)
    case 'id':
      return (controller, entity) => entity.id === template.value;
    case 'type':
      return (controller, entity) => entity.type === template.value;
    case 'state':
      return (controller, entity) => controller.entities[template.entity]?.data?.state == template.value
    case 'and':
      const andFilters = template.value.map(makeFilter);
      return (controller, entity) => andFilters.every(filter => filter(controller, entity))
    case 'or':
      const orFilters = template.value.map(makeFilter);
      return (controller, entity) => orFilters.some(filter => filter(controller, entity))

  }

  throw new Error('Invalid filter');
}

const initializedEntityFilters = filters.map(makeFilter);

function filterEntities(controller) {
  return (entity) => {
  if (!initializedEntityFilters.length) {
      return true;
    }
    return initializedEntityFilters.some((filter) => filter(controller, entity))
  };
}

function ControllerHeader({host, onToggleController, onRemoveController}) {
  return <header className={header}>
    <button onClick={onToggleController}><h3>{host}</h3></button>
    <button onClick={onRemoveController}>&#x2716;</button>
  </header>;
}

const ControllerEntities = memo(function ControllerEntities({entities}) {
  console.log('render entities', entities);
  const components = entities.map(entity => getComponentForEntity(entity)).filter(c => !!c);

  return components;
  // Maybe we should just always re-render?
}, (a, b) => JSON.stringify(a.entities) === JSON.stringify(b.entities));

const ControllerCard = forwardRef(function ControllerCard({children}, ref) {
  return <div className={card} ref={ref}>
    {children}
  </div>;
});

function pullControllerState(controller) {
  return {
    connected: controller.connected,
    connecting: controller.connecting,
    entities: Object.values(controller.entities).filter(filterEntities(controller)),
  };
}


function useController(controller) {
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'disconnected':
        return { ...state, ...pullControllerState(controller) };
      case 'connecting':
        return { ...state, ...pullControllerState(controller) };
      case 'connected':
        return { ...state, ...pullControllerState(controller) };
      case 'entitydiscovered':
        return { ...state, ...pullControllerState(controller) }
      // TODO: Right now this does not cover updates to entities themselves.
      // However, state filters might actually require a re-render when entity
      // state itself changes.
    }
  }, { ...pullControllerState(controller) });

  useEffect(() => {
    const onConnected = () => {
      dispatch({type: 'connected'});
    }
    const onEntityDiscovered = (event) => {
      dispatch({type: 'entitydiscovered'});
    }
    controller.addEventListener('entitydiscovered', onEntityDiscovered);
    controller.addEventListener('connected', onConnected);
    return () => {
      controller.removeEventListener('connected', onConnected);
      controller.removeEventListener('entitydiscovered', onEntityDiscovered);
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

  console.log('render');
  let cardContent = <Spinner />;
  if (state.connected && state.entities.length > 0) {
    cardContent = <ControllerEntities entities={state.entities} />;
  }

  return <li className={listItem}>
    <ControllerHeader 
      host={controller.host}
      onRemoveController={onRemove}
      onToggleController={() => {
        if (showCard) {
          console.log('hide card');
          setShowCard(false);
        } else {
          console.log('show card');
          setShowCard(true);
          actions.connect();
        }
      }}
    />
    <CSSTransition 
      nodeRef={cardRef} 
      in={showCard} 
      classNames={"fade"} 
      timeout={1000} 
      appear={true} 
      onExited={() => actions.disconnect()}
      unmountOnExit={true}
      mountOnEnter={true}
    >
      <ControllerCard ref={cardRef}>
        <div className={content}>
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
