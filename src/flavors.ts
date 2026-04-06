import { Flavor } from './types';

export const DEFAULT_FLAVORS: Flavor[] = [
  // Clásicas
  { id: 'revueltas', name: 'Revueltas', category: 'clasica' },
  { id: 'queso', name: 'Queso', category: 'clasica' },
  { id: 'frijol', name: 'Frijol', category: 'clasica' },
  { id: 'frijol-queso', name: 'Frijol con Queso', category: 'clasica' },

  // Especialidades
  { id: 'queso-loroco', name: 'Queso con Loroco', category: 'especialidad' },
  { id: 'chicharron-frijol', name: 'Chicharrón con Frijol', category: 'especialidad' },
  { id: 'chicharron-queso', name: 'Chicharrón con Queso', category: 'especialidad' },
  { id: 'queso-ayote', name: 'Queso con Ayote', category: 'especialidad' },
  { id: 'queso-jalapeno', name: 'Queso con Jalapeño', category: 'especialidad' },
  { id: 'queso-ajo', name: 'Queso con Ajo', category: 'especialidad' },
  { id: 'queso-chipilin', name: 'Queso con Chipilín', category: 'especialidad' },
  { id: 'queso-espinaca', name: 'Queso con Espinaca', category: 'especialidad' },
  { id: 'queso-mora', name: 'Queso con Mora', category: 'especialidad' },
  { id: 'queso-jamon', name: 'Queso con Jamón', category: 'especialidad' },
  { id: 'queso-pollo', name: 'Queso con Pollo', category: 'especialidad' },
  { id: 'queso-camaron', name: 'Queso con Camarón', category: 'especialidad' },
];
