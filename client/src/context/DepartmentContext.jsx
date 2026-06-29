import { createContext, useContext, useState } from 'react';

const DepartmentContext = createContext();

export const DEPARTMENTS = ['All', 'R&D', 'Development'];

export const useDepartment = () => {
  const ctx = useContext(DepartmentContext);
  if (!ctx) throw new Error('useDepartment must be used within DepartmentProvider');
  return ctx;
};

export const DepartmentProvider = ({ children }) => {
  // 'All' means no filter — admin sees everything combined
  const [activeDept, setActiveDept] = useState('All');

  // Helper: returns the dept value to pass to API calls
  // If 'All' → undefined (no filter), otherwise returns the dept string
  const deptFilter = activeDept === 'All' ? undefined : activeDept;

  return (
    <DepartmentContext.Provider value={{ activeDept, setActiveDept, deptFilter }}>
      {children}
    </DepartmentContext.Provider>
  );
};
