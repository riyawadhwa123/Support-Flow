'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'elevenlabs-convai': any;
        }
    }
}

export default function AgentPreviewPage() {
    const params = useParams();
    const agentId = params.id as string;

    useEffect(() => {
        // Use MutationObserver to detect when the shadow root is populated
        const observer = new MutationObserver(() => {
            const widget = document.querySelector('elevenlabs-convai');
            if (widget && widget.shadowRoot) {
                const shadow = widget.shadowRoot;

                // Inject styles if not already present
                if (!shadow.querySelector('#centered-style')) {
                    const style = document.createElement('style');
                    style.id = 'centered-style';
                    style.textContent = `
            .el-widget-trigger, button[part="trigger"] {
              position: relative !important;
              transform: none !important;
              margin: 0 !important;
              top: auto !important;
              left: auto !important;
              bottom: auto !important;
              right: auto !important;
            }
            .el-widget, [part="widget"] {
              position: relative !important;
              transform: none !important;
              margin: 0 !important;
              top: auto !important;
              left: auto !important;
              bottom: auto !important;
              right: auto !important;
            }
          `;
                    shadow.appendChild(style);

                    // Auto-click the button to open the widget (show the circle)
                    const button = shadow.querySelector('button');
                    if (button) {
                        button.click();
                    }
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="-m-6 h-[calc(100vh-64px)] bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden">
            {/* Back button */}
            <div className="absolute top-4 left-4 z-10">
                <Link href={`/agents/${agentId}`}>
                    <Button variant="ghost" className="hover:bg-muted">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Editor
                    </Button>
                </Link>
            </div>

            {/* Widget Container */}
            <div className="w-full h-full flex items-center justify-center">
                <elevenlabs-convai
                    agent-id={agentId}
                    style={{
                        display: 'flex',
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: 'scale(2.5)' // Significantly enlarge the widget
                    }}
                ></elevenlabs-convai>
            </div>

            <script src="https://elevenlabs.io/convai-widget/index.js" async type="text/javascript"></script>
        </div>
    );
}
