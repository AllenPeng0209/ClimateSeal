import { useState, useEffect, useCallback } from 'react';
import type { Vendor } from '~/components/dashboard/sections/schema';
import { fetchVendors, addVendor, updateVendor, deleteVendor, updateVendorStatus } from '../persistence/vendor';

/**
 * Custom hook for managing vendor data with Supabase
 * Provides state and operations for vendor management
 */
export function useVendorData() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all vendors from the database
    const loadVendors = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await fetchVendors();

            if (error) {
                throw error;
            }

            if (data) {
                setVendors(data);
            } else {
                setVendors([]);
            }
        } catch (err) {
            setError('Failed to load vendors: ' + (err instanceof Error ? err.message : String(err)));
            // Fallback to empty array on error
            setVendors([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load vendors on initial mount
    useEffect(() => {
        loadVendors();
    }, [loadVendors]);

    // Add a new vendor
    const handleAddVendor = useCallback(async (
        vendorData: Omit<Vendor, 'id' | 'updatedBy' | 'updatedAt'>
    ): Promise<Vendor | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await addVendor(vendorData);

            if (error) {
                throw error;
            }

            if (data) {
                setVendors(prev => [...prev, data]);
                return data;
            }

            return null;
        } catch (err) {
            const errorMsg = 'Failed to add vendor: ' + (err instanceof Error ? err.message : String(err));
            setError(errorMsg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update an existing vendor
    const handleUpdateVendor = useCallback(async (
        id: number,
        vendorData: Omit<Vendor, 'id' | 'updatedBy' | 'updatedAt'>
    ): Promise<Vendor | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await updateVendor(id, vendorData);

            if (error) {
                throw error;
            }

            if (data) {
                setVendors(prev => prev.map(vendor =>
                    vendor.id === id ? data : vendor
                ));
                return data;
            }

            return null;
        } catch (err) {
            const errorMsg = 'Failed to update vendor: ' + (err instanceof Error ? err.message : String(err));
            setError(errorMsg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Delete a vendor
    const handleDeleteVendor = useCallback(async (id: number): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            const { success, error } = await deleteVendor(id);

            if (error) {
                throw error;
            }

            if (success) {
                setVendors(prev => prev.filter(vendor => vendor.id !== id));
                return true;
            }

            return false;
        } catch (err) {
            const errorMsg = 'Failed to delete vendor: ' + (err instanceof Error ? err.message : String(err));
            setError(errorMsg);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Update vendor status
    const handleToggleVendorStatus = useCallback(async (
        id: number,
        status: '启用' | '禁用'
    ): Promise<Vendor | null> => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await updateVendorStatus(id, status);

            if (error) {
                throw error;
            }

            if (data) {
                setVendors(prev => prev.map(vendor =>
                    vendor.id === id ? data : vendor
                ));
                return data;
            }

            return null;
        } catch (err) {
            const errorMsg = 'Failed to update vendor status: ' + (err instanceof Error ? err.message : String(err));
            setError(errorMsg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        vendors,
        isLoading,
        error,
        loadVendors,
        addVendor: handleAddVendor,
        updateVendor: handleUpdateVendor,
        deleteVendor: handleDeleteVendor,
        toggleVendorStatus: handleToggleVendorStatus
    };
} 