import React, { createContext, useContext, useState, useEffect } from 'react';
import { Incident, DataContextType } from '../types';

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: React.ReactNode;
}

// Mock incidents for demonstration
const mockIncidents: Incident[] = [
  {
    id: '1',
    type: 'red-flag',
    title: 'Corruption in Public Procurement',
    description: 'Evidence of inflated contract prices in road construction project',
    location: { lat: 40.7128, lng: -74.0060, address: 'New York, NY' },
    media: [],
    status: 'under-investigation',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-01-15T10:30:00Z',
    userId: 'demo-user',
  },
  {
    id: '2',
    type: 'intervention',
    title: 'Bridge Repair Needed',
    description: 'Damaged bridge poses safety risk to commuters',
    location: { lat: 34.0522, lng: -118.2437, address: 'Los Angeles, CA' },
    media: [],
    status: 'resolved',
    createdAt: '2025-01-10T14:20:00Z',
    updatedAt: '2025-01-18T09:15:00Z',
    userId: 'demo-user',
    adminComment: 'Bridge repairs completed successfully',
  },
];

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    // Load incidents from localStorage or use mock data
    const storedIncidents = localStorage.getItem('incidents');
    if (storedIncidents) {
      setIncidents(JSON.parse(storedIncidents));
    } else {
      setIncidents(mockIncidents);
      localStorage.setItem('incidents', JSON.stringify(mockIncidents));
    }
  }, []);

  const saveIncidents = (updatedIncidents: Incident[]) => {
    setIncidents(updatedIncidents);
    localStorage.setItem('incidents', JSON.stringify(updatedIncidents));
  };

  const createIncident = (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const currentUser = localStorage.getItem('currentUser');
    const userId = currentUser ? JSON.parse(currentUser).id : 'anonymous';

    const newIncident: Incident = {
      ...incident,
      id: crypto.randomUUID(),
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveIncidents([...incidents, newIncident]);
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    const updatedIncidents = incidents.map((incident) =>
      incident.id === id
        ? { ...incident, ...updates, updatedAt: new Date().toISOString() }
        : incident
    );
    saveIncidents(updatedIncidents);
  };

  const deleteIncident = (id: string) => {
    const updatedIncidents = incidents.filter((incident) => incident.id !== id);
    saveIncidents(updatedIncidents);
  };

  const getIncidentById = (id: string) => {
    return incidents.find((incident) => incident.id === id);
  };

  const getUserIncidents = (userId: string) => {
    return incidents.filter((incident) => incident.userId === userId);
  };

  return (
    <DataContext.Provider
      value={{
        incidents,
        createIncident,
        updateIncident,
        deleteIncident,
        getIncidentById,
        getUserIncidents,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
