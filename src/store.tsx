import React, { createContext, useContext, useReducer, useCallback, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_FLAVORS } from './flavors';
import { Flavor, PersonOrder, PupusaOrder, OrderMode, AppState } from './types';

const STORAGE_KEY = 'pupusapp_state';

const initialState: AppState = {
  mode: 'master',
  persons: [],
  masterOrders: [],
  flavors: [...DEFAULT_FLAVORS],
};

type Action =
  | { type: 'SET_MODE'; mode: OrderMode }
  | { type: 'ADD_PERSON'; name: string }
  | { type: 'UPDATE_ORDER'; personId: string | null; flavorId: string; dough: 'arroz' | 'maiz'; delta: number }
  | { type: 'RESET_ORDER'; personId: string | null; flavorId: string; dough: 'arroz' | 'maiz' }
  | { type: 'ADD_FLAVOR'; name: string }
  | { type: 'RESET_ALL' }
  | { type: 'HYDRATE'; state: AppState };

function updateOrders(orders: PupusaOrder[], flavorId: string, dough: 'arroz' | 'maiz', delta: number): PupusaOrder[] {
  const existing = orders.find(o => o.flavorId === flavorId);
  if (existing) {
    const newVal = Math.max(0, existing[dough] + delta);
    const updated = orders.map(o =>
      o.flavorId === flavorId ? { ...o, [dough]: newVal } : o
    );
    return updated.filter(o => o.arroz > 0 || o.maiz > 0);
  }
  if (delta > 0) {
    return [...orders, { flavorId, arroz: dough === 'arroz' ? delta : 0, maiz: dough === 'maiz' ? delta : 0 }];
  }
  return orders;
}

function resetOrder(orders: PupusaOrder[], flavorId: string, dough: 'arroz' | 'maiz'): PupusaOrder[] {
  const updated = orders.map(o =>
    o.flavorId === flavorId ? { ...o, [dough]: 0 } : o
  );
  return updated.filter(o => o.arroz > 0 || o.maiz > 0);
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'SET_MODE':
      return { ...initialState, mode: action.mode, flavors: state.flavors };

    case 'ADD_PERSON': {
      const newPerson: PersonOrder = {
        id: Date.now().toString(),
        name: action.name,
        orders: [],
      };
      return { ...state, persons: [...state.persons, newPerson] };
    }

    case 'UPDATE_ORDER': {
      if (action.personId === null) {
        return {
          ...state,
          masterOrders: updateOrders(state.masterOrders, action.flavorId, action.dough, action.delta),
        };
      }
      return {
        ...state,
        persons: state.persons.map(p =>
          p.id === action.personId
            ? { ...p, orders: updateOrders(p.orders, action.flavorId, action.dough, action.delta) }
            : p
        ),
      };
    }

    case 'RESET_ORDER': {
      if (action.personId === null) {
        return {
          ...state,
          masterOrders: resetOrder(state.masterOrders, action.flavorId, action.dough),
        };
      }
      return {
        ...state,
        persons: state.persons.map(p =>
          p.id === action.personId
            ? { ...p, orders: resetOrder(p.orders, action.flavorId, action.dough) }
            : p
        ),
      };
    }

    case 'ADD_FLAVOR': {
      const id = 'custom-' + Date.now();
      const newFlavor: Flavor = { id, name: action.name, category: 'custom' };
      return { ...state, flavors: [...state.flavors, newFlavor] };
    }

    case 'RESET_ALL':
      return { ...initialState, flavors: [...DEFAULT_FLAVORS] };

    default:
      return state;
  }
}

interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isReady: boolean;
  getOrderCount: (personId: string | null, flavorId: string, dough: 'arroz' | 'maiz') => number;
  getTotalPupusas: (personId: string | null) => number;
  getMasterSummary: () => PupusaOrder[];
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);
  const [isReady, setIsReady] = useState(false);

  // Load persisted state on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as AppState;
          if (saved.flavors && saved.mode) {
            rawDispatch({ type: 'HYDRATE', state: saved });
          }
        } catch (_) {}
      }
      setIsReady(true);
    });
  }, []);

  // Persist state on every change (after hydration)
  useEffect(() => {
    if (isReady) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isReady]);

  const dispatch: React.Dispatch<Action> = useCallback((action: Action) => {
    rawDispatch(action);
  }, []);

  const getOrderCount = useCallback((personId: string | null, flavorId: string, dough: 'arroz' | 'maiz') => {
    const orders = personId === null
      ? state.masterOrders
      : state.persons.find(p => p.id === personId)?.orders ?? [];
    const order = orders.find(o => o.flavorId === flavorId);
    return order ? order[dough] : 0;
  }, [state]);

  const getTotalPupusas = useCallback((personId: string | null) => {
    if (personId === null) {
      if (state.mode === 'master') {
        return state.masterOrders.reduce((sum, o) => sum + o.arroz + o.maiz, 0);
      }
      return state.persons.reduce((sum, p) =>
        sum + p.orders.reduce((s, o) => s + o.arroz + o.maiz, 0), 0);
    }
    const person = state.persons.find(p => p.id === personId);
    return person ? person.orders.reduce((sum, o) => sum + o.arroz + o.maiz, 0) : 0;
  }, [state]);

  const getMasterSummary = useCallback((): PupusaOrder[] => {
    if (state.mode === 'master') return state.masterOrders;

    const summary: Map<string, PupusaOrder> = new Map();
    for (const person of state.persons) {
      for (const order of person.orders) {
        const existing = summary.get(order.flavorId);
        if (existing) {
          existing.arroz += order.arroz;
          existing.maiz += order.maiz;
        } else {
          summary.set(order.flavorId, { ...order });
        }
      }
    }
    return Array.from(summary.values()).filter(o => o.arroz > 0 || o.maiz > 0);
  }, [state]);

  return (
    <StoreContext.Provider value={{ state, dispatch, isReady, getOrderCount, getTotalPupusas, getMasterSummary }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
