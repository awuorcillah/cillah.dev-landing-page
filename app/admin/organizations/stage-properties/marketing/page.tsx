'use client'

import { useState } from 'react'
import { 
  Building2, 
  Search, 
  Plus, 
  Video, 
  Tag, 
  DollarSign, 
  Calendar, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  Filter, 
  Bot,
  ExternalLink,
  ShieldCheck
} from 'lucide-react'
import { Card } from '@/components/ui/card'

export interface StageProperty {
  id: string
  keyword: string
  title: string
  category: 'Residential' | 'Commercial' | 'Off-Plan'
  price: string
  description: string
  full_property_video_link: string
  date_added: string
}

const initialProperties: StageProperty[] = [
  // Residential (5)
  {
    id: 'prop-1',
    keyword: 'hartland',
    title: 'Sobha Hartland Residences',
    category: 'Residential',
    price: 'AED 1,500,000 (~$408,000 USD)',
    description: 'Sobha Hartland is an 8M sq. ft. luxury waterfront community in MBR City, Dubai featuring ready to move-in and off-plan residences with canal views.',
    full_property_video_link: 'https://stageproperties.com/videos/sobha-hartland.mp4',
    date_added: '2026-10-01'
  },
  {
    id: 'prop-2',
    keyword: 'eden',
    title: 'Eden Hills Villas',
    category: 'Residential',
    price: 'AED 8,500,000 (~$2,314,000 USD)',
    description: 'Exclusive master-planned villa community in Dubai Hills Estate featuring 5 & 6 bedroom ultra-luxury residences surrounded by green landscapes.',
    full_property_video_link: 'https://stageproperties.com/videos/eden-hills.mp4',
    date_added: '2026-10-03'
  },
  {
    id: 'prop-3',
    keyword: 'valia',
    title: 'Valia Residences',
    category: 'Residential',
    price: 'AED 2,100,000 (~$571,000 USD)',
    description: 'Modern high-rise residential apartments in Dubai Marina offering direct harbor views, private balconies, and resort amenities.',
    full_property_video_link: 'https://stageproperties.com/videos/valia-residences.mp4',
    date_added: '2026-10-04'
  },
  {
    id: 'prop-4',
    keyword: 'liv',
    title: 'LIV Marina Luxury Apartments',
    category: 'Residential',
    price: 'AED 1,850,000 (~$503,000 USD)',
    description: 'Waterfront living in the heart of Dubai Marina with floor-to-ceiling windows, Infinity pool, and luxury European finishes.',
    full_property_video_link: 'https://stageproperties.com/videos/liv-marina.mp4',
    date_added: '2026-10-05'
  },
  {
    id: 'prop-5',
    keyword: 'zaabeel',
    title: 'Eden House Za\'abeel',
    category: 'Residential',
    price: 'AED 4,200,000 (~$1,143,000 USD)',
    description: 'Bespoke architectural masterpiece by H&H Development offering signature concierge services, private gardens, and skyline views.',
    full_property_video_link: 'https://stageproperties.com/videos/eden-house.mp4',
    date_added: '2026-10-06'
  },

  // Commercial (5)
  {
    id: 'prop-6',
    keyword: 'sapphire',
    title: 'Sobha Sapphire Commercial Tower',
    category: 'Commercial',
    price: 'AED 1,200,000 (~$326,000 USD)',
    description: 'Prime Grade-A commercial office space in Business Bay with high-speed elevators, 24/7 security, and Dubai Canal views.',
    full_property_video_link: 'https://stageproperties.com/videos/sobha-sapphire.mp4',
    date_added: '2026-10-02'
  },
  {
    id: 'prop-7',
    keyword: 'tides',
    title: 'Seven Tides Commercial Plaza',
    category: 'Commercial',
    price: 'AED 2,500,000 (~$680,000 USD)',
    description: 'Multi-use commercial retail and corporate headquarter office spaces in Jumeirah Lakes Towers (JLT).',
    full_property_video_link: 'https://stageproperties.com/videos/seven-tides.mp4',
    date_added: '2026-10-04'
  },
  {
    id: 'prop-8',
    keyword: 'opus',
    title: 'The Opus Commercial Suites',
    category: 'Commercial',
    price: 'AED 3,800,000 (~$1,034,000 USD)',
    description: 'Iconic Zaha Hadid designed commercial hub in Business Bay featuring luxury executive offices and retail units.',
    full_property_video_link: 'https://stageproperties.com/videos/the-opus.mp4',
    date_added: '2026-10-05'
  },
  {
    id: 'prop-9',
    keyword: 'downtown_comm',
    title: 'Downtown Commercial Plaza',
    category: 'Commercial',
    price: 'AED 5,000,000 (~$1,361,000 USD)',
    description: 'High footfall retail storefronts and corporate spaces directly overlooking Burj Khalifa and Dubai Mall promenade.',
    full_property_video_link: 'https://stageproperties.com/videos/downtown-commercial.mp4',
    date_added: '2026-10-07'
  },
  {
    id: 'prop-10',
    keyword: 'baysquare',
    title: 'Bay Square Executive Offices',
    category: 'Commercial',
    price: 'AED 1,750,000 (~$476,000 USD)',
    description: 'Pedestrian-only mixed-use commercial community with low-rise office buildings, restaurants, and retail spaces in Business Bay.',
    full_property_video_link: 'https://stageproperties.com/videos/bay-square.mp4',
    date_added: '2026-10-08'
  },

  // Off-Plan (5)
  {
    id: 'prop-11',
    keyword: '360riverside',
    title: '360 Riverside Crescent (Sobha Hartland 2)',
    category: 'Off-Plan',
    price: 'AED 1,450,000 (~$394,000 USD)',
    description: 'Off-plan luxury lagoon waterfront tower with crystal lagoons, beach access, and 80/20 payment plans. Handover Q4 2027.',
    full_property_video_link: 'https://stageproperties.com/videos/360-riverside.mp4',
    date_added: '2026-10-02'
  },
  {
    id: 'prop-12',
    keyword: 'vitalia',
    title: 'Vitalia Palm Jumeirah Residences',
    category: 'Off-Plan',
    price: 'AED 6,900,000 (~$1,878,000 USD)',
    description: 'Boutique waterfront off-plan development on Palm Jumeirah offering private beach access, private pools, and Italian architecture.',
    full_property_video_link: 'https://stageproperties.com/videos/vitalia-palm.mp4',
    date_added: '2026-10-03'
  },
  {
    id: 'prop-13',
    keyword: '340riverside',
    title: '340 Riverside Crescent',
    category: 'Off-Plan',
    price: 'AED 1,380,000 (~$375,000 USD)',
    description: 'Premium off-plan 1-3 bedroom apartments overlooking Dubai skyline and wildlife sanctuary in Sobha Hartland 2.',
    full_property_video_link: 'https://stageproperties.com/videos/340-riverside.mp4',
    date_added: '2026-10-05'
  },
  {
    id: 'prop-14',
    keyword: 'mageye',
    title: 'MAG EYE Off-Plan Residences',
    category: 'Off-Plan',
    price: 'AED 980,000 (~$266,000 USD)',
    description: 'Gated off-plan residential community in Meydan District 7 featuring modern townhouses and contemporary apartments.',
    full_property_video_link: 'https://stageproperties.com/videos/mag-eye.mp4',
    date_added: '2026-10-07'
  },
  {
    id: 'prop-15',
    keyword: 'mercedes',
    title: 'Binghatti Mercedes-Benz Places',
    category: 'Off-Plan',
    price: 'AED 8,800,000 (~$2,395,000 USD)',
    description: 'Iconic 65-storey ultra-luxury branded skyscraper in Downtown Dubai integrated with smart home tech and private infinity pools.',
    full_property_video_link: 'https://stageproperties.com/videos/mercedes-benz-places.mp4',
    date_added: '2026-10-08'
  }
]

export default function StagePropertiesMarketingPage() {
  const [properties, setProperties] = useState<StageProperty[]>(initialProperties)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New Property Form State
  const [newProperty, setNewProperty] = useState<Omit<StageProperty, 'id' | 'date_added'>>({
    keyword: '',
    title: '',
    category: 'Residential',
    price: '',
    description: '',
    full_property_video_link: ''
  })

  const filteredProperties = properties.filter(prop => {
    const matchesSearch = 
      prop.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prop.date_added.includes(searchQuery)

    const matchesCategory = selectedCategory === 'All' || prop.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProperty.keyword || !newProperty.title || !newProperty.price) return

    const created: StageProperty = {
      ...newProperty,
      id: `prop-${Date.now()}`,
      date_added: new Date().toISOString().split('T')[0]
    }

    setProperties([created, ...properties])
    setIsModalOpen(false)
    setNewProperty({
      keyword: '',
      title: '',
      category: 'Residential',
      price: '',
      description: '',
      full_property_video_link: ''
    })
  }

  const handleDeleteProperty = (id: string) => {
    setProperties(properties.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Stage Properties Brokers L.L.C
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            📣 Marketing & AI Inventory Management (`search_stage_properties`)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage property listings referred to by your n8n Instagram AI Agent in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Bot className="w-3.5 h-3.5" /> n8n AI Agent Synced
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Marketing Role: Read/Write
          </span>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors rounded-lg shadow-lg shadow-amber-400/20"
          >
            <Plus className="w-4 h-4" /> Add Property
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Residential', 'Commercial', 'Off-Plan'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat} ({cat === 'All' ? properties.length : properties.filter(p => p.category === cat).length})
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search keyword, name, or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-amber-400/60 transition-colors"
          />
        </div>
      </div>

      {/* Properties Table */}
      <Card className="bg-slate-900/70 border-slate-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Keyword</th>
                <th className="py-3.5 px-4">Property Title</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price / Offer</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Video Link</th>
                <th className="py-3.5 px-4">Date Added</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredProperties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No properties match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProperties.map(prop => (
                  <tr key={prop.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 font-bold">
                        {prop.keyword}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">{prop.title}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        prop.category === 'Residential'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : prop.category === 'Commercial'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {prop.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 font-semibold">{prop.price}</td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={prop.description}>
                      {prop.description}
                    </td>
                    <td className="py-3.5 px-4">
                      {prop.full_property_video_link ? (
                        <a 
                          href={prop.full_property_video_link} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 font-medium underline text-[11px]"
                        >
                          <Video className="w-3 h-3" /> Watch Video
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">No video</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">{prop.date_added}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button 
                        onClick={() => handleDeleteProperty(prop.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete Property"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Property Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" /> Add Property to AI Inventory
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProperty} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Keyword (Instagram Trigger)</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. hartland, valia, vitalia"
                  value={newProperty.keyword}
                  onChange={(e) => setNewProperty({ ...newProperty, keyword: e.target.value.toLowerCase() })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Property Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sobha Hartland Residences"
                  value={newProperty.title}
                  onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select 
                    value={newProperty.category}
                    onChange={(e) => setNewProperty({ ...newProperty, category: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400/60"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Off-Plan">Off-Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price / Offer</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. AED 1,500,000 (~$408,000 USD)"
                    value={newProperty.price}
                    onChange={(e) => setNewProperty({ ...newProperty, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={3}
                  placeholder="Details on development, location, bedroom counts, amenities..."
                  value={newProperty.description}
                  onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Property Video Link</label>
                <input 
                  type="url" 
                  placeholder="https://stageproperties.com/videos/property.mp4"
                  value={newProperty.full_property_video_link}
                  onChange={(e) => setNewProperty({ ...newProperty, full_property_video_link: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-colors rounded-lg"
                >
                  Save Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
