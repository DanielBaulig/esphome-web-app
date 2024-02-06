export default function getEntityLabel(state) {
  return state.name || state.slug;
}
