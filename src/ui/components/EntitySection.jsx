import EntityCard from './EntityCard';

import { section as sectionClass } from './EntitySection.module.css'

export default function EntitySection({className, children, ...props}) {
  return <EntityCard className={`${className} ${sectionClass}`} {...props} >
    {children}
  </EntityCard>;
}
