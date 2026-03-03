import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { TutorialStep } from "@/lib/tutorialSteps";

interface TutorialOverlayProps {
    isActive: boolean;
    step: TutorialStep;
    currentStep: number;
    totalSteps: number;
    onNext: () => void;
    onPrev: () => void;
    onExit: () => void;
}

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

const RECT_PAD = 8;
const CIRCLE_PAD = 14;

const TutorialOverlay = ({
    isActive,
    step,
    currentStep,
    totalSteps,
    onNext,
    onPrev,
    onExit,
}: TutorialOverlayProps) => {
    const [rect, setRect] = useState<TargetRect | null>(null);
    const [ready, setReady] = useState(false);

    const isCircle = step.shape === "circle";

    const measure = useCallback(() => {
        if (!step.targetId) {
            setRect(null);
            setReady(true);
            return;
        }
        const el = document.getElementById(step.targetId);
        if (!el) {
            setRect(null);
            setReady(true);
            return;
        }

        const r = el.getBoundingClientRect();

        if (step.shape === "circle") {
            // Perfect circle centered on the element
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const diameter = Math.max(r.width, r.height) + CIRCLE_PAD * 2;
            setRect({
                top: cy - diameter / 2,
                left: cx - diameter / 2,
                width: diameter,
                height: diameter,
            });
        } else {
            setRect({
                top: r.top - RECT_PAD,
                left: r.left - RECT_PAD,
                width: r.width + RECT_PAD * 2,
                height: r.height + RECT_PAD * 2,
            });
        }

        // Scroll into view if partially hidden
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        setReady(true);
    }, [step.targetId, step.shape]);

    useEffect(() => {
        if (!isActive) {
            setReady(false);
            return;
        }
        // Wait longer when navigating to a new page
        setReady(false);
        const delay = step.route ? 450 : 150;
        const timer = setTimeout(measure, delay);
        window.addEventListener("resize", measure);
        window.addEventListener("scroll", measure, true);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("resize", measure);
            window.removeEventListener("scroll", measure, true);
        };
    }, [isActive, currentStep, measure, step.route]);

    if (!isActive || !ready) return null;

    const isFirst = currentStep === 0;
    const isLast = currentStep === totalSteps - 1;

    return (
        <div className="fixed inset-0 z-[9999]" aria-modal="true" role="dialog">
            {rect ? (
                <>
                    {/* Full-screen click blocker behind spotlight */}
                    <div
                        className="fixed inset-0"
                        style={{ zIndex: 9998 }}
                        onClick={onExit}
                    />

                    {/* Spotlight hole via box-shadow */}
                    <div
                        className="fixed pointer-events-none transition-all duration-300 ease-out"
                        style={{
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height,
                            borderRadius: isCircle ? "50%" : "12px",
                            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
                            zIndex: 9999,
                        }}
                    />

                    {/* Highlight ring */}
                    <div
                        className={`fixed pointer-events-none ${isCircle ? "rounded-full animate-spotlight-pulse" : ""
                            }`}
                        style={{
                            top: rect.top - 3,
                            left: rect.left - 3,
                            width: rect.width + 6,
                            height: rect.height + 6,
                            borderRadius: isCircle ? "50%" : "14px",
                            border: "2px solid hsl(215, 90%, 58%)",
                            zIndex: 9999,
                        }}
                    />
                </>
            ) : (
                /* Full overlay when no target */
                <div className="absolute inset-0 bg-black/60" onClick={onExit} />
            )}

            {/* Bottom tooltip card */}
            <Card className="fixed bottom-0 left-0 right-0 mx-auto max-w-md rounded-b-none rounded-t-2xl border-t shadow-2xl p-4 pb-6 z-[10000] animate-slide-up sm:bottom-4 sm:rounded-2xl sm:mx-4 sm:left-auto sm:right-4 sm:max-w-sm">
                {/* Exit button */}
                <button
                    onClick={onExit}
                    className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
                    aria-label="Exit tutorial"
                >
                    <X className="h-4 w-4 text-muted-foreground" />
                </button>

                {/* Step counter */}
                <p className="text-[11px] text-muted-foreground font-medium mb-1">
                    {currentStep + 1} / {totalSteps}
                </p>

                {/* Content */}
                <h3 className="text-base font-semibold leading-tight mb-1">
                    {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {step.description}
                </p>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-xs gap-1"
                        onClick={onPrev}
                        disabled={isFirst}
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back
                    </Button>

                    {/* Progress dots */}
                    <div className="flex gap-1.5">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-200 ${i === currentStep
                                        ? "w-4 bg-primary"
                                        : i < currentStep
                                            ? "w-1.5 bg-primary/40"
                                            : "w-1.5 bg-muted-foreground/20"
                                    }`}
                            />
                        ))}
                    </div>

                    <Button size="sm" className="h-9 text-xs gap-1" onClick={onNext}>
                        {isLast ? "Get Started" : "Next"}
                        {!isLast && <ChevronRight className="h-3.5 w-3.5" />}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default TutorialOverlay;
