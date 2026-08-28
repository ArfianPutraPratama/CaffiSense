interface Liver3DCanvasProps {
  className?: string;
}

export default function Liver3DCanvas({
  className = '',
}: Liver3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <iframe
        id="biodigital-liver-widget"
        src="https://human.biodigital.com/widget/?be=2VKs&background.colors=0,0,0,1,0,0,0,1&initial.hand-hint=true&ui-info=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&uaid=3abIT"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Liver"
      />
    </div>
  );
}
