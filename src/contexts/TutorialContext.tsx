import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { tutorialSteps } from "@/lib/tutorialSteps";
import TutorialOverlay from "@/components/TutorialOverlay";

interface TutorialContextType {
    start: () => void;
    isActive: boolean;
    hasCompleted: () => boolean;
}

const TutorialContext = createContext<TutorialContextType>({
    start: () => { },
    isActive: false,
    hasCompleted: () => false,
});

const TUTORIAL_KEY_PREFIX = "tutorial_completed";
const getKey = (userId: string) =>
    userId ? `${TUTORIAL_KEY_PREFIX}_${userId}` : TUTORIAL_KEY_PREFIX;

export function TutorialProvider({
    userId,
    children,
}: {
    userId: string;
    children: ReactNode;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    const step = tutorialSteps[currentStep] ?? tutorialSteps[0];

    const hasCompleted = useCallback(
        () => localStorage.getItem(getKey(userId)) === "true",
        [userId]
    );

    const start = useCallback(() => {
        setCurrentStep(0);
        setIsActive(true);
    }, []);

    // Navigate to the correct route when the step changes
    useEffect(() => {
        if (isActive && step.route && location.pathname !== step.route) {
            navigate(step.route);
        }
    }, [isActive, currentStep, step.route, navigate, location.pathname]);

    const next = useCallback(() => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep((s) => s + 1);
        } else {
            setIsActive(false);
            localStorage.setItem(getKey(userId), "true");
            if (location.pathname !== "/") navigate("/");
        }
    }, [currentStep, userId, navigate, location.pathname]);

    const prev = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep((s) => s - 1);
        }
    }, [currentStep]);

    const exit = useCallback(() => {
        setIsActive(false);
        localStorage.setItem(getKey(userId), "true");
        if (location.pathname !== "/") navigate("/");
    }, [userId, navigate, location.pathname]);

    return (
        <TutorialContext.Provider value={{ start, isActive, hasCompleted }}>
            {children}
            <TutorialOverlay
                isActive={isActive}
                step={step}
                currentStep={currentStep}
                totalSteps={tutorialSteps.length}
                onNext={next}
                onPrev={prev}
                onExit={exit}
            />
        </TutorialContext.Provider>
    );
}

export const useTutorial = () => useContext(TutorialContext);
