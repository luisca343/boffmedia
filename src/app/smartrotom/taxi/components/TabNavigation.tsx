import { FaMapMarkedAlt, FaWalking } from 'react-icons/fa'

interface TabNavigationProps {
  activeTab: 'map' | 'list';
  setActiveTab: (tab: 'map' | 'list') => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  return (
    <div className="absolute top-16 left-0 right-0 flex z-10">
      <button 
        className={`flex-1 py-3 font-medium ${activeTab === 'map' ? 'bg-blue-600 text-white' : 'bg-blue-400 text-blue-50'}`}
        onClick={() => setActiveTab('map')}
      >
        <FaMapMarkedAlt className="inline mr-2" /> Mapa
      </button>
      <button 
        className={`flex-1 py-3 font-medium ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-blue-400 text-blue-50'}`}
        onClick={() => setActiveTab('list')}
      >
        <FaWalking className="inline mr-2" /> Destinos
      </button>
    </div>
  )
}