import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Activity } from '../types/activity';

interface ActivityContextType {
    activeActivities: Activity[];
    loading: boolean;
    error: string | null;
    refreshActivities: () => Promise<void>;
}

export const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
    const [activeActivities, setActiveActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshActivities = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8000/vote/activities/active/', {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch active activities');
            }

            const data = await response.json();
            setActiveActivities(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshActivities();
    }, []);

    return (
        <ActivityContext.Provider
            value={{
                activeActivities,
                loading,
                error,
                refreshActivities
            }}
        >
            {children}
        </ActivityContext.Provider>
    );
}

export function useActivity() {
    const context = useContext(ActivityContext);
    if (context === undefined) {
        throw new Error('useActivity must be used within an ActivityProvider');
    }
    return context;
}