import React, { useState, useMemo } from 'react';
import {
  Shirt,
  LayoutGrid, // Using LayoutGrid as a generic T-Shirt placeholder
  Footprints, // Using Footprints for pants/trousers
  Grid,
  List,
  Plus,
} from 'lucide-react';
import { ClothingType } from '../types'; 

// ==============================================
// CONFIGURATION & TYPE MAPPING
// ==============================================

type ViewMode = 'grid' | 'list';

interface ItemSelectionProps {
  clothingTypes: ClothingType[]; 
  onItemSelect: (item: ClothingType) => void;
}

const iconMap: { [key: string]: React.ElementType } = {
  shirt: Shirt,
  tshirt: LayoutGrid, 
  pants: Footprints, 
  trousers: Footprints,
  dress: Shirt, 
};

const getIcon = (key: string) => iconMap[key.toLowerCase()] || Shirt;

// --- MOCK DATA (REMOVE in production, use propClothingTypes instead) ---
const MOCK_CLOTHING_DATA: ClothingType[] = [
    { id: 1, name: 'T-Shirt', price: 5.00, category: 'Tops', iconKey: 'tshirt', additionalCharge: 0.50 },
    { id: 2, name: 'Dress Shirt', price: 7.50, category: 'Tops', iconKey: 'shirt', additionalCharge: 0.50 },
    // Example of a potentially missing price from an API/DB:
    // { id: 3, name: 'Pants (Cotton)', price: undefined, category: 'Bottoms', iconKey: 'pants', additionalCharge: 1.00 },
    { id: 3, name: 'Pants (Cotton)', price: 10.00, category: 'Bottoms', iconKey: 'pants', additionalCharge: 1.00 },
    { id: 4, name: 'Cocktail Dress', price: 25.00, category: 'Dresses', iconKey: 'dress', additionalCharge: 5.00 },
];
// ------------------------------------------------------------------------

// ==============================================
// SUB-COMPONENTS
// ==============================================

interface CategoryButtonProps {
  category: string;
  count: number;
  isSelected: boolean;
  onSelect: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ category, count, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    className={`
      flex justify-between items-center w-full p-3 mb-1 rounded-lg transition-colors
      ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
    `}
  >
    <span className="font-semibold">{category}</span>
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isSelected ? 'bg-indigo-700' : 'bg-gray-300 text-gray-600'}`}>
      {count}
    </span>
  </button>
);


interface ItemDisplayProps {
  item: ClothingType;
  onSelect: (item: ClothingType) => void;
}

// --- Grid View Item (Big Icon/Image) ---
const ItemCard: React.FC<ItemDisplayProps> = ({ item, onSelect }) => {
  const IconComponent = getIcon(item.iconKey || item.name);

  return (
    <button
      onClick={() => onSelect(item)}
      className="group flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition duration-200 transform hover:scale-105"
      title={`Add ${item.name}`}
    >
      <IconComponent className="w-16 h-16 text-indigo-600 mb-2" strokeWidth={2.5} /> 
      
      <div className="text-center">
        <p className="font-bold text-sm text-gray-800 truncate w-full px-1">{item.name}</p>
        {/* 👇 FIX HERE: Use (item.price || 0) to guarantee a number */}
        <p className="text-xs text-green-600 font-medium">${(item.price || 0).toFixed(2)}</p>
      </div>
      <Plus className="w-5 h-5 text-indigo-400 mt-2 transition-transform group-hover:rotate-90" />
    </button>
  );
};


// --- List View Item (Normal Type, No Big Icon) ---
const ItemRow: React.FC<ItemDisplayProps> = ({ item, onSelect }) => {
  const IconComponent = getIcon(item.iconKey || item.name);

  return (
    <button
      onClick={() => onSelect(item)}
      className="flex items-center justify-between w-full p-3 bg-white border-b border-gray-100 hover:bg-gray-50 transition duration-150 rounded-lg"
      title={`Add ${item.name}`}
    >
      <div className="flex items-center space-x-3">
        <IconComponent className="w-5 h-5 text-indigo-500" />
        <span className="font-medium text-gray-700">{item.name}</span>
      </div>
      <div className="flex items-center space-x-4">
        {/* 👇 FIX HERE: Use (item.price || 0) to guarantee a number */}
        <span className="text-sm text-green-600 font-semibold">${(item.price || 0).toFixed(2)}</span>
        <Plus className="w-4 h-4 text-indigo-500" />
      </div>
    </button>
  );
};


// ==============================================
// MAIN EXPORTED COMPONENT
// ==============================================

export default function ClothingSelector({ clothingTypes: propClothingTypes, onItemSelect }: ItemSelectionProps) {
  const clothingData = propClothingTypes.length > 0 ? propClothingTypes : MOCK_CLOTHING_DATA;

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = useMemo(() => {
    const map = clothingData.reduce((acc, item) => {
      const categoryName = item.category || 'Other';
      acc[categoryName] = (acc[categoryName] || []).concat(item);
      return acc;
    }, {} as { [key: string]: ClothingType[] });
    
    const categoryList = Object.keys(map).map(category => ({
      name: category,
      count: map[category].length,
      items: map[category],
    }));

    return [{ name: 'All', count: clothingData.length, items: clothingData }, ...categoryList];

  }, [clothingData]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') {
      return clothingData;
    }
    const categoryData = categories.find(cat => cat.name === selectedCategory);
    return categoryData ? categoryData.items : [];
  }, [selectedCategory, clothingData, categories]);

  return (
    <div className="flex bg-gray-50 h-full overflow-hidden border border-gray-200 rounded-lg shadow-inner">
      
      {/* -------------------- 1. Sidebar: Categories -------------------- */}
      <div className="w-1/4 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Categories</h3>
        {categories.map((cat) => (
          <CategoryButton
            key={cat.name}
            category={cat.name}
            count={cat.count}
            isSelected={selectedCategory === cat.name}
            onSelect={() => setSelectedCategory(cat.name)}
          />
        ))}
      </div>

      {/* -------------------- 2. Main Content: Items -------------------- */}
      <div className="w-3/4 p-4 flex flex-col overflow-hidden">
        
        {/* Header and View Toggle */}
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
          <h3 className="text-xl font-bold text-indigo-700">
            {selectedCategory} Items ({filteredItems.length})
          </h3>
          <div className="flex space-x-2">
            {/* Grid View Toggle Button */}
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Grid View"
            >
              <Grid className="w-5 h-5" />
            </button>
            {/* List View Toggle Button */}
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Normal/List View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Item Display Area */}
        <div className="flex-grow overflow-y-auto pr-2">
          {viewMode === 'grid' ? (
            // GRID VIEW: Big Images/Icons
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`}>
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} onSelect={onItemSelect} />
              ))}
            </div>
          ) : (
            // LIST VIEW: Normal Type without big images
            <div className="space-y-1">
              {filteredItems.map(item => (
                <ItemRow key={item.id} item={item} onSelect={onItemSelect} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Ensure you have these types defined in your 'types.ts' file
// export interface ClothingType {
//   id: number;
//   name: string;
//   price: number;
//   category?: string;
//   iconKey?: string; // Optional key to map to a Lucide icon
//   additionalCharge: number;
// }

// export interface TicketItem {
//   // ... other ticket item properties
// }