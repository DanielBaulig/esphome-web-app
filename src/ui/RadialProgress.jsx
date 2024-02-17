import { radialProgess } from './RadialProgress.module.css';

export default function RadialProgess({progress}) {
  progress = Math.max(0, Math.min(1, progress));
  return <div
    className={radialProgess}
  >
    <div style={{backgroundImage: `conic-gradient(black ${360*progress}deg, transparent 0deg)`}}></div>
    {Math.round(progress * 100)}%
  </div>;
}
