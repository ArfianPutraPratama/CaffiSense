interface Kidney3DCanvasProps {
  className?: string;
}

export default function Kidney3DCanvas({
  className = '',
}: Kidney3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <iframe
        id="biodigital-kidney-widget"
        src="https://human.biodigital.com/widget/?be=2Y7S&background.colors=0,0,0,1,0,0,0,1&initial.hand-hint=true&ui-info=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&uaid=3acFM"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Kidney"
      />
    </div>
  );
}
