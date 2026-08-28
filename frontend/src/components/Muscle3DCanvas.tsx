interface Muscle3DCanvasProps {
  className?: string;
}

export default function Muscle3DCanvas({
  className = '',
}: Muscle3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 
        BioDigital widget untuk Otot (Muscular System) 
      */}
      <iframe
        id="biodigital-muscle-widget"
        src="https://human.biodigital.com/widget/?be=2PcB&background.colors=0,0,0,1,0,0,0,1&initial.hand-hint=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&ui-info=true&uaid=3YfOR"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Muscle"
      />
    </div>
  );
}
