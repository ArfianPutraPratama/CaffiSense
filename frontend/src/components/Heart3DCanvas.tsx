interface Heart3DCanvasProps {
  className?: string;
  isPulsing?: boolean;
  bpm?: number;
}

export default function Heart3DCanvas({
  className = '',
}: Heart3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <iframe
        id="biodigital-widget"
        src="https://human.biodigital.com/widget/?be=2hh3&background.colors=0,0,0,1,0,0,0,1&initial.hand-hint=true&ui-info=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&uaid=3QpzU"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Heart"
      />
    </div>
  );
}
