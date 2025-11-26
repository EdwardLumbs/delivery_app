import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

type UseSupabaseOptions<T, P = void> = {
    fn: (params?: P) => Promise<T>;
    params?: P;
    skip?: boolean;
};

type UseSupabaseReturn<T, P> = {
    data: T | null;
    loading: boolean;
    error: string | null;
    refetch: (newParams?: P) => Promise<void>;
};

export const useSupabase = <T, P = void>({
    fn,
    params,
    skip = false,
}: UseSupabaseOptions<T, P>): UseSupabaseReturn<T, P> => {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(!skip);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(
        async (fetchParams?: P) => {
            setLoading(true);
            setError(null);

            try {
                const result = await fn(fetchParams ?? params);
                setData(result);
            } catch (err: any) {
                const errorMessage = err?.message || "An error occurred";
                setError(errorMessage);
                Alert.alert("Error", errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [fn, params]
    );

    useEffect(() => {
        if (!skip) {
            fetchData();
        }
    }, [skip, fetchData]);

    const refetch = async (newParams?: P) => {
        await fetchData(newParams);
    };

    return { data, loading, error, refetch };
};
