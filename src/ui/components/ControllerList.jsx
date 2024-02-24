import Spinner from '../Spinner';
import DrawerCard from './DrawerCard';
import StateEntity from './entities/StateEntity';
import Icon from '@mdi/react';

import { 
  useRef, 
  useEffect, 
  useState, 
  useReducer, 
  lazy, 
  Suspense 
} from 'react';

import { 
  mdiAlert, 
  mdiToyBrickSearch, 
  mdiCloseThick, 
  mdiWifiArrowLeftRight, 
  mdiWifi 
} from '@mdi/js';

import { flexFill, flex } from '../utility.module.css';
import css from '../css';

import {
  controllerList,
  closeButton,
  messageIcon,
} from './ControllerList.module.css';

import { filters } from '../../config';

function delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}

const LightComponent = lazy(() => import('./entities/LightComponent'));
const BinarySensorEntity = lazy(() => import('./entities/BinarySensorEntity'));
const ButtonEntity = lazy(() => import('./entities/ButtonEntity'));
const SelectEntity = lazy(() => import('./entities/SelectEntity'));
const SensorEntity = lazy(() => import('./entities/SensorEntity'));
const SwitchEntity = lazy(() => import('./entities/SwitchEntity'));
const FanEntity = lazy(() => import('./entities/FanEntity'));
const CoverEntity = lazy(() => import('./entities/CoverEntity'));
const NumberEntity = lazy(() => import('./entities/NumberEntity'));

function getComponentForEntity(entity) {
  const loading = <Spinner />;
  switch (entity.type) {
    case 'light':
      return <Suspense fallback={loading} key={entity.id}>
        <LightComponent entity={entity} />
      </Suspense>;
    case 'binary_sensor':
      return <Suspense fallback={loading} key={entity.id}>
        <BinarySensorEntity entity={entity} />
      </Suspense>;
    case 'button':
      return <Suspense fallback={loading} key={entity.id}>
        <ButtonEntity entity={entity} />
      </Suspense>;
    case 'select':
      return <Suspense fallback={loading} key={entity.id}>
        <SelectEntity entity={entity} />
      </Suspense>;
    case 'sensor':
      return <Suspense fallback={loading} key={entity.id}>
        <SensorEntity entity={entity} />
      </Suspense>;
    case 'switch':
      return <Suspense fallback={loading} key={entity.id}>
        <SwitchEntity entity={entity} />
      </Suspense>;
    case 'fan':
      return <Suspense fallback={loading} key={entity.id}>
        <FanEntity entity={entity} />
      </Suspense>;
    case 'cover':
      return <Suspense fallback={loading} key={entity.id}>
        <CoverEntity entity={entity} />
      </Suspense>;
    case 'number':
      return <Suspense fallback={loading} key={entity.id}>
        <NumberEntity entity={entity} />
      </Suspense>;
    default:
      return <StateEntity entity={entity} key={entity.id} />
  }

  return null;
}

function makeFilter(template) {
  if (typeof template !== 'object') {
    template = { type: 'id', value: template };
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

function ControllerEntities({entities}) {
  const components = entities.map(entity => getComponentForEntity(entity)).filter(c => !!c);

  return components;
};

function pullControllerState(controller) {
  return {
    connected: controller.connected,
    connecting: controller.connecting,
    entities: Object.values(controller.entities).filter(filterEntities(controller)),
  };
}

function useController(controller) {
  const activityTimeoutRef = useRef(null);

  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case 'disconnected':
        return { ...state, ...pullControllerState(controller), error: false };
      case 'connecting':
        return { ...state, ...pullControllerState(controller) };
      case 'connected':
        return { ...state, ...pullControllerState(controller) };
      case 'activity_begin':
        return { ...state, activity: true, lastActivity: Date.now() };
      case 'activity_end':
        return { ...state, activity: false };
      case 'error':
        return { ...state, error: true };
      case 'entitydiscovered':
        return { ...state, ...pullControllerState(controller) }
      // TODO: Right now this does not cover updates to entities themselves.
      // However, state filters might actually require a re-render when
      // entity state itself changes.
    }
    throw new Error(`Invalid action ${action.type}`);
  }, { ...pullControllerState(controller) });

  useEffect(() => {
    const onConnected = () => {
      dispatch({type: 'connected'});
    };
    const onEntityDiscovered = (event) => {
      dispatch({type: 'entitydiscovered'});
    };
    const onError = (event) => {
      dispatch({type: 'error'});
    };
    const onActivity = (e) => {
      console.log(e);
      const activityTimeout = 500;

      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      activityTimeoutRef.current = setTimeout(() => {
        activityTimeoutRef.current = null;
        dispatch({type: 'activity_end' });
      }, activityTimeout);

      dispatch({type: 'activity_begin'});
    };

    function onConnecting(event) {
      dispatch({type: 'connecting'});
    }

    controller.addEventListener('entitydiscovered', onEntityDiscovered);
    controller.addEventListener('log', onActivity);
    controller.addEventListener('state', onActivity);
    controller.addEventListener('ping', onActivity);
    controller.addEventListener('connected', onConnected);
    controller.addEventListener('error', onError);
    controller.addEventListener('connecting', onConnecting);
    return () => {
      controller.removeEventListener('connected', onConnected);
      controller.removeEventListener('entitydiscovered', onEntityDiscovered);
      controller.removeEventListener('log', onActivity);
      controller.removeEventListener('state', onActivity);
      controller.removeEventListener('ping', onActivity);
      controller.removeEventListener('error', onError);
      controller.removeEventListener('connecting', onConnecting);
    };
  }, [controller]);

  const actions = {
    connect() {
      controller.connect();
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
  const isConnected = state.connecting || state.connected;
  const [isDrawerOpen, setDrawerOpen] = useState(isConnected);

  let cardContent = <Spinner />;
  if (state.connected && state.lastActivity) {
    if (state.entities.length > 0) {
      cardContent = <ControllerEntities entities={state.entities} />;
    } else {
      cardContent = <>
        <Icon className={messageIcon} path={mdiToyBrickSearch} size={3.35} />
        <h3 className={css(flexFill, flex)}>No entities found</h3>
      </>;
    }
  }

  if (state.error) {
    cardContent = <>
      <Icon className={messageIcon} path={mdiAlert} size={3.35} />
      <h3 className={css(flexFill, flex)}>Something went wrong</h3>
    </>;
  }

  useEffect(() => {
    if (isConnected) {
      setDrawerOpen(true);
    }
  }, [isConnected]);

  const activityIcon = state.activity ? mdiWifiArrowLeftRight : mdiWifi;
  const lastActivity = state.lastActivity ? 
    `Last activity at ${(new Date(state.lastActivity)).toLocaleString()}` : 
    'No activity yet';
  const glyph = <Icon
    path={activityIcon}
    title={lastActivity}
    size={0.8}
  />;

  return <li><DrawerCard
    open={isDrawerOpen}
    title={controller.host}
    onToggleDrawer={() => setDrawerOpen(!isDrawerOpen)}
    onBeginOpening={() => actions.connect()}
    onDoneClosing={() => actions.disconnect()}
    glyph={glyph}
    menu={
      <button tabIndex={0} onClick={onRemove} className={closeButton}>
        <Icon path={mdiCloseThick} size={0.8} />
      </button>
    }
  >
    {cardContent}
  </DrawerCard></li>;
}

export default function ControllerList({controllers, onRemoveController}) {
  return <ul className={controllerList}>
    {controllers.map(controller => <ControllerListItem 
      controller={controller} 
      key={controller.host} 
      onRemove={() => onRemoveController(controller)} 
    />)}
  </ul>;
}
