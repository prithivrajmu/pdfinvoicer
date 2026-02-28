import { useState, useEffect, useCallback } from "react";
import { SellerDetails } from "@/types/invoice";

const SELLER_KEY = "seller_details";

const defaultSeller: SellerDetails = {
  businessName: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  cityState: "",
  pincode: "",
  gstin: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  upiId: "",
  defaultNotes: "",
};

const loadSeller = (): SellerDetails => {
  try {
    const data = localStorage.getItem(SELLER_KEY);
    return data ? { ...defaultSeller, ...JSON.parse(data) } : defaultSeller;
  } catch {
    return defaultSeller;
  }
};

export const useSellerDetails = () => {
  const [seller, setSeller] = useState<SellerDetails>(loadSeller);

  useEffect(() => {
    localStorage.setItem(SELLER_KEY, JSON.stringify(seller));
  }, [seller]);

  const updateSeller = useCallback((updates: Partial<SellerDetails>) => {
    setSeller((prev) => ({ ...prev, ...updates }));
  }, []);

  const isComplete = seller.businessName && seller.name && seller.gstin;

  return { seller, updateSeller, setSeller, isComplete };
};
