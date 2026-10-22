'use client'

import { useState } from 'react'
import {
  Stethoscope,
  Users,
  Calendar,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  Phone,
  MessageSquare,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Shield,
  FileText,
  UserCheck,
  Building,
  HeartPulse,
  Sparkles,
  ClipboardList
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ChetuPatient {
  id: string
  patient_number: string
  full_name: string
  phone: string
  gender: string
  age: number
  blood_group: string
  allergies: string
  last_visit: string
  status: 'active' | 'inpatient' | 'discharged'
}

interface ChetuAppointment {
  id: string
  patient_name: string
  doctor_name: string
  department: string
  time: string
  type: 'In-Person' | 'Telemedicine' | 'Home Visit'
  complaint: string
  status: 'confirmed' | 'in_consultation' | 'scheduled' | 'completed'
}

interface ChetuLead {
  id: string
  full_name: string
  phone: string
  source: 'WhatsApp' | 'Website' | 'Walk-in'
  symptoms: string
  urgency: 'Emergency' | 'Urgent' | 'Routine'
  time_ago: string
  status: 'new' | 'triaged' | 'booked'
  assigned_nurse: string
}

const SAMPLE_PATIENTS: ChetuPatient[] = [
  { id: '1', patient_number: 'CH-2026-001', full_name: 'Grace Wambui Mwangi', phone: '+254 712 345 678', gender: 'Female', age: 34, blood_group: 'O+', allergies: 'Penicillin', last_visit: 'Yesterday', status: 'active' },
  { id: '2', patient_number: 'CH-2026-002', full_name: 'Brian Kiprop Cheruiyot', phone: '+254 722 890 123', gender: 'Male', age: 42, blood_group: 'A+', allergies: 'None', last_visit: '12 Oct 2026', status: 'active' },
  { id: '3', patient_number: 'CH-2026-003', full_name: 'Amina Hassan Noor', phone: '+254 733 456 789', gender: 'Female', age: 28, blood_group: 'B+', allergies: 'Sulfa Drugs', last_visit: 'Today', status: 'active' },
  { id: '4', patient_number: 'CH-2026-004', full_name: 'David Otieno Odhiambo', phone: '+254 798 112 233', gender: 'Male', age: 51, blood_group: 'O-', allergies: 'Aspirin', last_visit: '5 Oct 2026', status: 'active' },
  { id: '5', patient_number: 'CH-2026-005', full_name: 'Faith Muthoni Karanja', phone: '+254 705 998 877', gender: 'Female', age: 23, blood_group: 'AB+', allergies: 'None', last_visit: 'Today', status: 'active' }
]

const SAMPLE_APPOINTMENTS: ChetuAppointment[] = [
  { id: '1', patient_name: 'Grace Wambui Mwangi', doctor_name: 'Dr. Chetu (Chief Medical Officer)', department: 'General Outpatient', time: '10:30 AM', type: 'In-Person', complaint: 'Recurring migraine and blood pressure review', status: 'in_consultation' },
  { id: '2', patient_name: 'Brian Kiprop Cheruiyot', doctor_name: 'Dr. Sarah Omondi', department: 'Internal Medicine', time: '11:15 AM', type: 'In-Person', complaint: 'Post-surgical routine checkup', status: 'confirmed' },
  { id: '3', patient_name: 'Amina Hassan Noor', doctor_name: 'Dr. Michael Kariuki', department: 'Pediatrics / Family', time: '01:00 PM', type: 'Telemedicine', complaint: 'Child acute fever consultation', status: 'scheduled' },
  { id: '4', patient_name: 'David Otieno Odhiambo', doctor_name: 'Dr. Chetu (Chief Medical Officer)', department: 'Cardiology Review', time: '02:30 PM', type: 'In-Person', complaint: 'ECG interpretation & medication adjustment', status: 'scheduled' },
  { id: '5', patient_name: 'Faith Muthoni Karanja', doctor_name: 'Dr. Sarah Omondi', department: 'General Outpatient', time: '03:45 PM', type: 'In-Person', complaint: 'Routine blood test screening', status: 'scheduled' }
]

const SAMPLE_LEADS: ChetuLead[] = [
  { id: '1', full_name: 'Mercy Achieng', phone: '+254 711 223 344', source: 'WhatsApp', symptoms: 'Severe abdominal pain and fever since yesterday night', urgency: 'Urgent', time_ago: '15m ago', status: 'new', assigned_nurse: 'Nurse Beatrice' },
  { id: '2', full_name: 'Peter Njoroge', phone: '+254 722 556 677', source: 'WhatsApp', symptoms: 'Inquiring about full body executive wellness screening packages', urgency: 'Routine', time_ago: '42m ago', status: 'triaged', assigned_nurse: 'Reception / Triage' },
  { id: '3', full_name: 'Fatuma Mohammed', phone: '+254 734 889 900', source: 'Website', symptoms: 'Baby vaccination schedule and pediatric clinic availability', urgency: 'Routine', time_ago: '2h ago', status: 'booked', assigned_nurse: 'Nurse Christine' },
  { id: '4', full_name: 'John Mutua', phone: '+254 780 445 566', source: 'WhatsApp', symptoms: 'Chest tightness following physical exertion', urgency: 'Emergency', time_ago: '3h ago', status: 'triaged', assigned_nurse: 'Dr. Chetu (Flagged)' }
]

export default function ChetuHealthcareDashboard() {
  const [activeTab, setActiveTab] = useState('triage')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Clinic Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-950/60 pb-6 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-950 p-6 rounded-2xl border border-emerald-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Healthcare & Clinical Services
              </span>
              <span className="text-xs text-slate-400">Chetu Healthcare Clinic</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Clinical Care & Patient Operations
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Dedicated Medical Dashboard • WhatsApp Triage Automation • Patient Consultations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/40 py-1 px-3">
            <Activity className="w-3.5 h-3.5 mr-1.5 animate-pulse" /> Clinic Live
          </Badge>
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Book Consultation
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Patients</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">128</div>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> +14 new this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Appointments</span>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">14</div>
            <p className="text-[11px] text-sky-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> 5 completed, 1 in session
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inbound Triage Leads</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <MessageSquare className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">22</div>
            <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> 2 urgent, 1 emergency
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Doctors on Shift</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">4</div>
            <p className="text-[11px] text-purple-400 mt-1">
              General, Internal, Pediatrics
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="triage" className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          <TabsList className="bg-slate-900 border border-slate-800 p-1">
            <TabsTrigger value="triage" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> WhatsApp Triage Leads
            </TabsTrigger>
            <TabsTrigger value="appointments" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Doctor Consultations
            </TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-xs">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Patient Directory
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search patient, symptoms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Inbound Triage Leads */}
        <TabsContent value="triage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_LEADS.map((lead) => (
              <Card key={lead.id} className="bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 text-sm">{lead.full_name}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-400" /> {lead.phone}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">Source: {lead.source} • {lead.time_ago}</span>
                    </div>

                    <Badge
                      className={
                        lead.urgency === 'Emergency'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px]'
                          : lead.urgency === 'Urgent'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]'
                      }
                      variant="outline"
                    >
                      {lead.urgency}
                    </Badge>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Symptoms / Inquiry</span>
                    {lead.symptoms}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                    <span className="text-slate-400 text-[11px]">
                      Assigned: <strong className="text-slate-200">{lead.assigned_nurse}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-[11px] border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">
                        Chat on WhatsApp
                      </Button>
                      <Button size="sm" className="h-7 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                        Schedule Doctor
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Doctor Appointments */}
        <TabsContent value="appointments" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Time</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Doctor Assigned</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Chief Complaint</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {SAMPLE_APPOINTMENTS.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-emerald-400">{apt.time}</td>
                      <td className="p-3 font-medium text-white">{apt.patient_name}</td>
                      <td className="p-3 text-slate-300">{apt.doctor_name}</td>
                      <td className="p-3 text-slate-400">{apt.department}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                          {apt.type}
                        </Badge>
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs truncate">{apt.complaint}</td>
                      <td className="p-3">
                        <Badge
                          className={
                            apt.status === 'in_consultation'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]'
                              : apt.status === 'confirmed'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]'
                              : 'bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px]'
                          }
                          variant="outline"
                        >
                          {apt.status.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: Patient Directory */}
        <TabsContent value="patients" className="space-y-4">
          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Patient ID</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Gender / Age</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Allergies</th>
                    <th className="p-3">Last Visit</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {SAMPLE_PATIENTS.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-mono text-emerald-400 font-semibold">{p.patient_number}</td>
                      <td className="p-3 font-medium text-white">{p.full_name}</td>
                      <td className="p-3 text-slate-400">{p.phone}</td>
                      <td className="p-3 text-slate-300">{p.gender}, {p.age}y</td>
                      <td className="p-3 font-semibold text-slate-200">{p.blood_group}</td>
                      <td className="p-3 text-rose-300">{p.allergies}</td>
                      <td className="p-3 text-slate-400">{p.last_visit}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-950/30">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
