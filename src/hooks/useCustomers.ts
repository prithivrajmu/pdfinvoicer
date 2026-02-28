import { useState, useEffect, useCallback } from "react";
import { Customer } from "@/types/customer";

const STORAGE_KEY = "customers";

const load = (): Customer[] => {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : [];
  } catch { return []; }
};

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  }, [customers]);

  const addCustomer = useCallback((c: Omit<Customer, "id">) => {
    const customer: Customer = { ...c, id: crypto.randomUUID() };
    setCustomers((prev) => [customer, ...prev]);
    return customer;
  }, []);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCustomer = useCallback((id: string) => customers.find((c) => c.id === id), [customers]);

  return { customers, addCustomer, updateCustomer, deleteCustomer, getCustomer };
};
