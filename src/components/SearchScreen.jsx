import { useState, useRef, useEffect } from 'react'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const API_URL = import.meta.env.VITE_API_URL
const LOADING_STEPS = [
  'Searching for businesses...',
  'Checking for duplicates...',
  'Scoring leads with AI...',
  'Almost done...',
]
const SOURCES = ['Google', 'Instagram', 'Facebook']
const MAX_HISTORY = 10
const defaultCenter = { lat: 30.2672, lng: -97.7431 }

function SearchScreen({ user }) {
  const [view, setView] = useState('search') // 'search' | 'history'
  const [niche, setNiche] = useState('')
  const [location, setLocation] = useState('')
  const [selectedSources, setSelectedSources] = useState(['Google'])
  const [markerPosition, setMarkerPosition] = useState(null)
  const [mapCenter, setMapCenter] = useState(defaultCenter)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [leads, setLeads] = useState([])
  const [loadingStep, setLoadingStep] = useState(0)
  const [selectedLead, setSelectedLead] = useState(null)
  const [selectedLeadPosition, setSelectedLeadPosition] = useState(null)
  const [filterSource, setFilterSource] = useState('all')
  const [pastSearches, setPastSearches] = useState([])
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const geocoderRef = useRef(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_KEY,
  })

  useEffect(() => {
    loadHistory()
  }, [user.id])

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('lead_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error) {
      setPastSearches(data)
    } else {
      console.error('Failed to load history:', error)
    }
  }

  const enforceHistoryLimit = async () => {
    const { data, error } = await supabase
      .from('lead_lists')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !data) return

    if (data.length > MAX_HISTORY) {
      const idsToDelete = data.slice(MAX_HISTORY).map((d) => d.id)
      await supabase.from('lead_lists').delete().in('id', idsToDelete)
    }
  }

  const toggleSource = (source) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    )
  }

  const getGeocoder = () => {
    if (!geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder()
    }
    return geocoderRef.current
  }

  const geocodeLocation = () => {
    return new Promise((resolve, reject) => {
      if (!isLoaded || !location.trim()) {
        reject('Enter a location first')
        return
      }
      getGeocoder().geocode({ address: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const { lat, lng } = results[0].geometry.location
          resolve({ lat: lat(), lng: lng() })
        } else {
          reject(`Geocoding failed: ${status}`)
        }
      })
    })
  }

  const handleLeadClick = (lead) => {
    setSelectedLead(lead)

    if (lead.source === 'instagram') {
      window.open(`https://instagram.com/${lead.business_name}`, '_blank', 'noopener,noreferrer')
      return
    }

    if (lead.source === 'facebook' && lead.facebook_url) {
      window.open(lead.facebook_url, '_blank', 'noopener,noreferrer')
      return
    }

    if (!lead.address || !isLoaded) return

    getGeocoder().geocode({ address: lead.address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const { lat, lng } = results[0].geometry.location
        const position = { lat: lat(), lng: lng() }
        setSelectedLeadPosition(position)
        setMapCenter(position)
      }
    })
  }

  const saveSearchToHistory = async (nicheVal, locationVal, sourcesVal, leadsData) => {
    const { data: listData, error: listError } = await supabase
      .from('lead_lists')
      .insert({
        user_id: user.id,
        name: `${nicheVal} in ${locationVal}`,
        niche: nicheVal,
        location: locationVal,
        sources: sourcesVal,
      })
      .select()
      .single()

    if (listError) {
      console.error('Failed to save search:', listError)
      return
    }

    const leadsToInsert = leadsData.map((lead) => ({
      list_id: listData.id,
      business_name: lead.business_name,
      address: lead.address || null,
      phone: lead.phone || null,
      website: lead.website || null,
      social_links: lead.facebook_url ? { facebook: lead.facebook_url } : {},
      category: lead.category || null,
      score: lead.score || null,
      score_reason: lead.score_reason || null,
      source: lead.source || 'google',
    }))

    const { error: leadsError } = await supabase.from('leads').insert(leadsToInsert)
    if (leadsError) {
      console.error('Failed to save leads:', leadsError)
    }

    await enforceHistoryLimit()

    setPastSearches((prev) => [listData, ...prev].slice(0, MAX_HISTORY))
  }

  const loadPastSearch = async (list) => {
    setNiche(list.niche)
    setLocation(list.location)
    setSelectedSources(list.sources || ['Google'])
    setFilterSource('all')
    setError('')
    setSelectedLead(null)
    setSelectedLeadPosition(null)
    setView('search')

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('list_id', list.id)

    if (!error) {
      setLeads(data)
    } else {
      console.error('Failed to load past search leads:', error)
    }
  }

  const exportHistoryItem = async (list) => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('list_id', list.id)

    if (error || !data) {
      console.error('Failed to fetch leads for export:', error)
      return
    }

    const exportData = data.map((lead) => ({
      'Business Name': lead.business_name,
      'Score': lead.score,
      'Reason': lead.score_reason,
      'Address': lead.address || '',
      'Phone': lead.phone || '',
      'Website': lead.website || '',
      'Category': lead.category || '',
      'Source': lead.source || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')
    XLSX.writeFile(workbook, `${list.name}.xlsx`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setSearching(true)
    setLeads([])
    setLoadingStep(0)
    setSelectedLead(null)
    setSelectedLeadPosition(null)
    setFilterSource('all')

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length)
    }, 2500)

    try {
      const position = await geocodeLocation()
      setMarkerPosition(position)
      setMapCenter(position)

      const sourcesParam = selectedSources.map((s) => s.toLowerCase()).join(',')
      const searchRes = await fetch(
        `${API_URL}/search-leads?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}&sources=${sourcesParam}`
      )
      if (!searchRes.ok) throw new Error('Search failed — check the backend is running')
      const searchData = await searchRes.json()

      if (searchData.unavailable_sources?.length > 0) {
        setError(
          `${searchData.unavailable_sources.join(', ')} not available — showing results from other sources.`
        )
      }

      if (searchData.results.length === 0) {
        setError((prev) => prev || 'No businesses found for that niche and location.')
        return
      }

      const processRes = await fetch(`${API_URL}/process-leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData.results),
      })
      if (!processRes.ok) throw new Error('Processing failed')
      const processData = await processRes.json()

      setLeads(processData.leads)
      await saveSearchToHistory(niche, location, selectedSources, processData.leads)
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message)
    } finally {
      clearInterval(stepInterval)
      setSearching(false)
    }
  }

  const filteredLeads = filterSource === 'all'
    ? leads
    : leads.filter((lead) => lead.source === filterSource)

  const exportToExcel = () => {
    const exportData = filteredLeads.map((lead) => ({
      'Business Name': lead.business_name,
      'Score': lead.score,
      'Reason': lead.score_reason,
      'Address': lead.address || '',
      'Phone': lead.phone || '',
      'Website': lead.website || '',
      'Category': lead.category || '',
      'Source': lead.source || '',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')
    XLSX.writeFile(workbook, `${niche || 'leads'}-${location || 'search'}.xlsx`)
  }

  const scoreBadgeColor = (score) => {
    if (score === 'hot') return 'bg-red-500/20 text-red-400'
    if (score === 'warm') return 'bg-amber-500/20 text-amber-400'
    return 'bg-blue-500/20 text-blue-400'
  }

  const formatDateTime = (isoString) => {
    const d = new Date(isoString)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ---- HISTORY SCREEN ----
  if (view === 'history') {
    return (
      <div className="h-screen bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('search')}
              className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition text-gray-300"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-white font-medium text-lg">Search History</h1>
          </div>
          <span className="text-gray-500 text-xs">{pastSearches.length} / {MAX_HISTORY}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {pastSearches.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 text-sm">No searches yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-w-2xl mx-auto">
              {pastSearches.map((search) => (
                <div
                  key={search.id}
                  className="bg-gray-800 rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{search.name}</p>
                    <p className="text-gray-500 text-xs mt-1">{formatDateTime(search.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => loadPastSearch(search)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => exportHistoryItem(search)}
                      title="Download Excel"
                      className="w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-green-400 transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <path d="M12 18v-6M9 15l3 3 3-3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---- MAIN SEARCH SCREEN ----
  return (
    <div className="h-screen bg-gray-900 flex overflow-hidden">
      <div className="w-1/2 p-6 flex flex-col h-screen">
        <div className="flex items-center justify-between mb-6 flex-shrink-0 relative">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-purple-400" />
            <span className="text-white font-medium">Leadflow</span>
          </div>

          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition text-gray-300 text-sm font-medium"
          >
            {user.email?.[0]?.toUpperCase()}
          </button>

          {showProfileMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfileMenu(false)}
              />
              <div className="absolute top-10 right-0 w-56 bg-gray-800 rounded-xl shadow-xl z-20 border border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700">
                  <p className="text-white text-sm truncate">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    setView('history')
                    setShowProfileMenu(false)
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v5h5" />
                    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                    <path d="M12 7v5l4 2" />
                  </svg>
                  History
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-700 transition border-t border-gray-700"
                >
                  Switch account
                </button>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex-shrink-0">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Niche</label>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Gyms, restaurants..."
                required
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or area"
                required
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {SOURCES.map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => toggleSource(source)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  selectedSources.includes(source)
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                {source}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={searching}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg py-2 text-sm font-medium mb-4 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <p className="text-red-400 text-sm mb-4 flex-shrink-0">{error}</p>}

        <div className="rounded-2xl overflow-hidden flex-1 min-h-0">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%', borderRadius: '16px' }}
              center={mapCenter}
              zoom={selectedLeadPosition ? 15 : markerPosition ? 12 : 10}
              options={{ styles: darkMapStyle, disableDefaultUI: true, zoomControl: true }}
            >
              {markerPosition && !selectedLeadPosition && <Marker position={markerPosition} />}

              {selectedLeadPosition && (
                <Marker
                  position={selectedLeadPosition}
                  onClick={() => setSelectedLead(selectedLead)}
                />
              )}

              {selectedLead && selectedLeadPosition && (
                <InfoWindow
                  position={selectedLeadPosition}
                  onCloseClick={() => {
                    setSelectedLead(null)
                    setSelectedLeadPosition(null)
                  }}
                >
                  <div className="text-gray-900 text-sm max-w-[220px]">
                    <p className="font-semibold mb-1">{selectedLead.business_name}</p>
                    {selectedLead.phone && <p className="text-xs">📞 {selectedLead.phone}</p>}
                    {selectedLead.website && (
                      <p className="text-xs truncate">
                        🌐 <a href={selectedLead.website} target="_blank" rel="noreferrer">{selectedLead.website}</a>
                      </p>
                    )}
                    {selectedLead.category && <p className="text-xs">🏷️ {selectedLead.category}</p>}
                    <p className="text-xs mt-1">{selectedLead.address}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full bg-gray-800 rounded-2xl flex items-center justify-center text-gray-500 text-sm">
              Loading map...
            </div>
          )}
        </div>
      </div>

      <div className="w-1/2 border-l border-gray-800 flex flex-col">
        <div className="px-6 pt-6 pb-3 flex-shrink-0 flex items-center justify-between gap-2">
          <p className="text-gray-400 text-sm whitespace-nowrap">
            {filteredLeads.length > 0
              ? `${filteredLeads.length} leads found`
              : searching ? '' : 'Results will appear here'}
          </p>

          <div className="flex items-center gap-2">
            {leads.length > 0 && (
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="bg-gray-800 text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All sources</option>
                <option value="google">Google</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            )}

            {leads.length > 0 && (
              <button
                onClick={exportToExcel}
                title="Export to Excel"
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition flex-shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6M9 15l3 3 3-3" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {searching ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-gray-700 border-t-purple-500 animate-spin" />
              <p className="text-gray-400 text-sm">{LOADING_STEPS[loadingStep]}</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 text-sm">
                {leads.length > 0 ? 'No leads match this filter' : 'Results will appear here'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredLeads.map((lead, i) => (
                <div
                  key={i}
                  onClick={() => handleLeadClick(lead)}
                  className={`bg-gray-800 rounded-xl p-4 cursor-pointer transition hover:bg-gray-750 ${
                    selectedLead?.business_name === lead.business_name ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{lead.business_name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${scoreBadgeColor(lead.score)}`}>
                      {lead.score}
                    </span>
                    {lead.source === 'instagram' && (
                      <span className="text-xs text-pink-400">📷 Instagram</span>
                    )}
                    {lead.source === 'facebook' && (
                      <span className="text-xs text-blue-400">👤 Facebook</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{lead.score_reason}</p>
                  {lead.address && <p className="text-gray-500 text-xs mt-1">{lead.address}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1f2937' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1f2937' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]

export default SearchScreen