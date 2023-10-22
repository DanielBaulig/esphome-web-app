function useLightEntityState(entity) {
  const [state, dispatch] = useReducer((state, action) => {
  }, {
    ...entity.data
  })
  useEffect(() => {
    const listener = () => {

    }
    entity.addEventListener('update', listener);
    return () => {
      entity.removeEventListener('update', listener);
    };
  }, [entity]);
}

export default function ESPHomeWebLightEntity({entity: ESPHomeWebLightEntity}) {
  return <div>
  </div>;
}
