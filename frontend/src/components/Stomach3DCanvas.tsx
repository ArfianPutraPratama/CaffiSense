interface Stomach3DCanvasProps {
  className?: string;
  isMotilityActive?: boolean;
  acidStimulationLevel?: 'safe' | 'warning' | 'danger';
}

export default function Stomach3DCanvas({
  className = '',
}: Stomach3DCanvasProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <iframe
        id="biodigital-stomach-widget"
        src="https://human.biodigital.com/widget/?be=2YBE&background.colors=0,0,0,1,0,0,0,1&initial.hand-hint=true&ui-fullscreen=true&ui-center=false&ui-dissect=true&ui-zoom=true&ui-help=true&ui-tools-display=primary&ui-info=true&uaid=3aeNA"
        width="100%"
        height="100%"
        className="w-full h-full border-0"
        allowFullScreen
        title="BioDigital 3D Stomach"
      />
    </div>
  );
}
