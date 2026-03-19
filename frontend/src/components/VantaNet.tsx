import { useEffect, useRef } from 'react';

interface VantaNetProps {
    className?: string;
}

const VantaNet: React.FC<VantaNetProps> = ({ className = '' }) => {
    const vantaRef = useRef<HTMLDivElement>(null);
    const vantaEffect = useRef<any>(null);

    useEffect(() => {
        if (!vantaRef.current) return;

        // Wait for VANTA to be available
        const initVanta = () => {
            if ((window as any).VANTA && (window as any).THREE) {
                vantaEffect.current = (window as any).VANTA.NET({
                    el: vantaRef.current!,
                    mouseControls: true,
                    touchControls: true,
                    gyroControls: false,
                    minHeight: 200.0,
                    minWidth: 200.0,
                    scale: 1.0,
                    scaleMobile: 1.0,
                    color: 0x402e7a,
                    backgroundColor: 0x131313,
                    points: 11.0,
                });
            }
        };

        let checkInterval: ReturnType<typeof setInterval>;

        const tryInit = () => {
            try {
                if ((window as any).VANTA && (window as any).THREE) {
                    initVanta();
                } else {
                    checkInterval = setInterval(() => {
                        if ((window as any).VANTA && (window as any).THREE) {
                            clearInterval(checkInterval);
                            initVanta();
                        }
                    }, 100);
                }
            } catch (e) {
                // Vanta failed to load, skip silently
            }
        };

        tryInit();

        return () => {
            clearInterval(checkInterval);
            if (vantaEffect.current) {
                try { vantaEffect.current.destroy(); } catch (e) {}
            }
        };
    }, []);

    return <div ref={vantaRef} className={className} />;
};

export default VantaNet;
