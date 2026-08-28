interface Lungs3DCanvasProps {
  className?: string;
}

export default function Lungs3DCanvas({
  className = '',
}: Lungs3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 
        BioDigital widget untuk Paru-paru (Lungs) 
      */}
      <iframe
        id="biodigital-lungs-widget"
        src="https://human.biodigital.com/widget/?be=2Enc&background.colors=255,255,255,1,51,64,77,1&initial.hand-hint=true&ui-info=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&uaid=3bFJI"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Lungs"
      />
    </div>
  );
}
