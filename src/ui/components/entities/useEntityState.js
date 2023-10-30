import {useReducer, useEffect} from 'react';

export default function useEntityState(entity) {
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

