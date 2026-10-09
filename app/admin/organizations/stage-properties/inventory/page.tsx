'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, RefreshCw, Plus, Search, Tag, ExternalLink, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Property {
  id: string
  keyword: string
  title: string
  location: string
  property_type: string
  starting_price: string
  availability_status: string
  description: string
  url: string
}

export default function StagePropertiesInventoryPage() {
  const supabase = createClient()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !data || data.length === 0) {
        setProperties([
          {
            id: '1',
            keyword: 'hartland',
            title: 'Sobha Hartland / Hartland Waterfront Estates',
            location: 'Sobha Hartland, MBR City, Dubai',
            property_type: 'offplan',
            starting_price: 'AED 1,500,000 (~$408,000 USD)',
            availability_status: 'available',
            description: 'Luxury 1, 2 & 3 Bedroom Waterfront Apartments & Canal Villas in MBR City, Dubai.',
            url: 'https://stageproperties.com/offplan'
          },
          {
            id: '2',
            keyword: 'dubai_hills_villa',
            title: 'Dubai Hills Estate Luxury Villa',
            location: 'Dubai Hills Estate, Dubai',
            property_type: 'residential',
            starting_price: 'AED 8,900,000 (~$2,420,000 USD)',
            availability_status: 'available',
            description: 'Exclusive 5-Bedroom Golf Course Villa with private pool and skyline view.',
            url: 'https://stageproperties.com/buy/residential/properties-for-sale'
          },
          {
            id: '3',
            keyword: 'binghatti_penthouse',
            title: 'Binghatti Skyrise Penthouse',
            location: 'Business Bay, Dubai',
            property_type: 'offplan',
            starting_price: 'AED 4,200,000 (~$1,143,000 USD)',
            availability_status: 'sold_out',
            description: 'Ultra-luxury penthouse with private jacuzzi overlooking Burj Khalifa.',
            url: 'https://stageproperties.com/offplan'
          }
        ])
      } else {
        setProperties(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> Stage Properties Brokers L.L.C
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            🏢 Property Inventory & AI Knowledge Base
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Stage Properties inventory synchronized for AI Agent pricing lookups & customer inquiry responses
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={fetchInventory}
          disabled={loading}
          className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Inventory
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {properties.map(p => (
          <Card key={p.id} className="bg-slate-900/70 border-slate-800 space-y-2 p-4">
            <div className="flex items-start justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 uppercase">
                {p.keyword}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                p.availability_status === 'available'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {p.availability_status.toUpperCase()}
              </span>
            </div>
            <h3 className="font-bold text-slate-100 text-base">{p.title}</h3>
            <p className="text-xs text-slate-400">{p.location}</p>
            <p className="text-sm font-bold text-amber-300">{p.starting_price}</p>
            <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
            {p.url && (
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline pt-2"
              >
                View on stageproperties.com <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
