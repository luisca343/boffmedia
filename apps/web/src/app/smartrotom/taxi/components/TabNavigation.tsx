import { FaMapMarkedAlt, FaWalking } from 'react-icons/fa'

interface TabNavigationProps {
  activeTab: 'map' | 'list';
  setActiveTab: (tab: 'map' | 'list') => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  return (
    <div className="absolute top-16 left-0 right-0 flex z-10 shadow-lg">
      <button 
        className={`flex-1 py-3 font-medium transition-all duration-200 flex items-center justify-center ${
          activeTab === 'map' 
            ? 'bg-[#041F4E] text-white border-b-2 border-yellow-400' 
            : 'bg-secondary-700/50 text-white hover:bg-secondary-600/50'
        }`}
        onClick={() => setActiveTab('map')}
      >
        <FaMapMarkedAlt className={`mr-2 ${activeTab === 'map' ? 'text-yellow-400' : ''}`} /> 
        <span>Mapa</span>
      </button>
      <button 
        className={`flex-1 py-3 font-medium transition-all duration-200 flex items-center justify-center ${
          activeTab === 'list' 
            ? 'bg-[#041F4E] text-white border-b-2 border-yellow-400' 
            : 'bg-secondary-700/50 text-white hover:bg-secondary-600/50'
        }`}
        onClick={() => setActiveTab('list')}
      >
        <FaWalking className={`mr-2 ${activeTab === 'list' ? 'text-yellow-400' : ''}`} /> 
        <span>Destinos</span>
      </button>
    </div>
  )
}