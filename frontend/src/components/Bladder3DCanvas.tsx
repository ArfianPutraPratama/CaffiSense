interface Bladder3DCanvasProps {
  className?: string;
}

export default function Bladder3DCanvas({
  className = '',
}: Bladder3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 
        BioDigital widget untuk Kandung Kemih (Bladder) 
      */}
      <iframe
        id="biodigital-bladder-widget"
        src="https://human.biodigital.com/widget/?be=2Epx&background.colors=0,0,0,1,0,0,0,1&initial.hand-hint=true&ui-info=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&uaid=3bFYx"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Bladder"
      />
    </div>
  );
}
