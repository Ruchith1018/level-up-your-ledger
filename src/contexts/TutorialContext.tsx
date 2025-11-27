import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface TutorialContextType {
    isActive: boolean;
    currentStep: number;
    startTutorial: () => void;
    nextStep: () => void;
    endTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
    const { settings, updateSettings } = useSettings();
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();

    // Steps:
    // 1. Dashboard -> Add Expense
    // 2. Dashboard -> Analytics Nav Item
    // 3. Dashboard -> Subscriptions Nav Item
    // 4. Subscriptions -> Add Subscription

    useEffect(() => {
        if (isActive) {
            if (currentStep === 1 && location.pathname !== '/' && location.pathname !== '/dashboard') {
                navigate('/');
            } else if (currentStep === 2 && location.pathname !== '/' && location.pathname !== '/dashboard') {
                navigate('/');
            } else if (currentStep === 3 && location.pathname !== '/' && location.pathname !== '/dashboard') {
                navigate('/');
            } else if (currentStep === 4 && location.pathname !== '/subscriptions') {
                navigate('/subscriptions');
            }
        }
    }, [isActive, currentStep, location.pathname, navigate]);

    const startTutorial = () => {
        setIsActive(true);
        setCurrentStep(1);
        navigate('/');
    };

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(prev => prev + 1);
        } else {
            endTutorial();
        }
    };

    const endTutorial = () => {
        setIsActive(false);
        setCurrentStep(0);
        updateSettings({ ...settings, hasCompletedTutorial: true });
        navigate('/dashboard');
    };

    return (
        <TutorialContext.Provider value={{ isActive, currentStep, startTutorial, nextStep, endTutorial }}>
            {children}
        </TutorialContext.Provider>
    );
}

export const useTutorial = () => {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
};
