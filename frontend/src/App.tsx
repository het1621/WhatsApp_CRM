import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';
import AddContactModal from './components/AddContactModal';
import EditContactModal from './components/EditContactModal';
import NewBroadcastModal from './components/NewBroadcastModal';
import CreateTemplateModal from './components/CreateTemplateModal';
import EditTemplateModal from './components/EditTemplateModal';
import {
  LayoutDashboard, Users, FileText, Send, Settings, LogOut,
  Plus, Search, Trash2, Edit2, ChevronRight, MessageCircle,
  CheckCircle2, XCircle, Radio, Calendar, Copy, Check,
  ArrowUpRight, Target, BarChart3, Zap, ShieldCheck,
  ChevronDown, ChevronUp, Link as LinkIcon, AlertCircle
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [contactSearch, setContactSearch] = useState('');

  // Modals state
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  // Settings state
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [showManualSettings, setShowManualSettings] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const navigate = useNavigate();
  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const fetchContacts = () => { api.get('/contacts').then(r => setContacts(r.data)).catch(e => { if (e.response?.status === 401) handleLogout(); }); };
  const fetchCampaigns = () => { api.get('/campaigns').then(r => setCampaigns(r.data)).catch(e => { if (e.response?.status === 401) handleLogout(); }); };
  const fetchTemplates = () => { api.get('/templates').then(r => setTemplates(r.data)).catch(e => { if (e.response?.status === 401) handleLogout(); }); };
  const fetchAnalytics = () => { api.get('/analytics/overview').then(r => setAnalytics(r.data)).catch(() => {}); };
  const fetchSettings = () => {
    api.get('/settings').then(r => {
      setPhoneNumberId(r.data.phoneNumberId || '');
      setWabaId(r.data.wabaId || '');
      setAppSecret(r.data.appSecret || '');
      setIsConnected(!!r.data.isConnected);
      setHasToken(!!r.data.hasToken);
    }).catch(() => {});
  };

  const deleteContact = async (id: string) => { if (!confirm('Remove this contact?')) return; try { await api.delete(`/contacts/${id}`); fetchContacts(); } catch {} };
  const deleteTemplate = async (id: string) => { if (!confirm('Delete this template?')) return; try { await api.delete(`/templates/${id}`); fetchTemplates(); } catch {} };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsMsg('');
    try {
      const res = await api.put('/settings', { phoneNumberId, accessToken, wabaId, appSecret });
      setSettingsMsg('Settings saved successfully!');
      setIsConnected(res.data.settings?.isConnected || false);
      setHasToken(res.data.settings?.hasToken || false);
      setTimeout(() => setSettingsMsg(''), 3000);
    } catch (err: any) {
      setSettingsMsg(err.response?.data?.error || 'Failed to save settings');
    } flex {
      setSettingsLoading(false);
    }
  };

  // Meta Embedded Signup (1-Click Facebook OAuth)
  const launchFacebookEmbeddedSignup = () => {
    const appId = (import.meta as any).env?.VITE_FACEBOOK_APP_ID;
    
    if (!appId || appId === 'your_meta_app_id_here') {
      setSettingsMsg('To use 1-Click Facebook Connect, add VITE_FACEBOOK_APP_ID in frontend/.env file or use "Advanced: Manual Credentials Entry" below.');
      setShowManualSettings(true);
      return;
    }
    
    // Check if FB SDK is loaded or trigger FB.login directly
    if (typeof (window as any).FB !== 'undefined') {
      (window as any).FB.login((response: any) => {
        if (response.authResponse) {
          const code = response.authResponse.code;
          handleEmbeddedSignupCallback({ code });
        } else {
          setSettingsMsg('Facebook authentication was canceled.');
        }
      }, {
        config_id: (import.meta as any).env?.VITE_EMBEDDED_SIGNUP_CONFIG_ID,
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: 'whatsapp_business_messaging',
        }
      });
    } else {
      // Fallback popup if FB SDK is not on window
      const popupUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(window.location.origin + '/settings')}&scope=whatsapp_business_messaging,whatsapp_business_management&response_type=code`;
      window.open(popupUrl, 'Facebook Embedded Signup', 'width=600,height=700');
    }
  };

  const handleEmbeddedSignupCallback = async (data: { code?: string; wabaId?: string; phoneNumberId?: string; accessToken?: string }) => {
    setSettingsLoading(true);
    setSettingsMsg('');
    try {
      const res = await api.post('/settings/embedded-signup', data);
      setSettingsMsg('WhatsApp Connected Successfully!');
      setIsConnected(true);
      setHasToken(true);
      fetchSettings();
      setTimeout(() => setSettingsMsg(''), 4000);
    } catch (err: any) {
      setSettingsMsg(err.response?.data?.error || 'Embedded signup failed');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Window event listener for Meta's postMessage embedded signup response
  useEffect(() => {
    const sessionInfoListener = (event: MessageEvent) => {
      if (event.origin.includes('facebook.com') || event.origin.includes('meta.com')) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.type === 'WA_EMBEDDED_SIGNUP') {
            const { waba_id, phone_number_id, code } = data.data || {};
            handleEmbeddedSignupCallback({ wabaId: waba_id, phoneNumberId: phone_number_id, code });
          }
        } catch {}
      }
    };
    window.addEventListener('message', sessionInfoListener);
    return () => window.removeEventListener('message', sessionInfoListener);
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchCampaigns();
    fetchTemplates();
    fetchAnalytics();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'contacts') fetchContacts();
    else if (activeTab === 'campaigns') fetchCampaigns();
    else if (activeTab === 'templates') fetchTemplates();
    else if (activeTab === 'dashboard') { fetchContacts(); fetchCampaigns(); fetchAnalytics(); }
    else if (activeTab === 'settings') fetchSettings();
  }, [activeTab]);

  const filteredContacts = contacts.filter(c =>
    (c.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch)
  );

  const totalSent = analytics?.totalSent || campaigns.reduce((s, c) => s + (c.sentMessages || 0), 0);
  const totalFailed = analytics?.totalFailed || campaigns.reduce((s, c) => s + (c.failedMessages || 0), 0);
  const deliveryRate = analytics?.deliveryRate ?? 100;

  const nav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const statusStyle = (s: string) => {
    switch(s) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'scheduled': return 'bg-violet-100 text-violet-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const statusDot = (s: string) => {
    switch(s) {
      case 'completed': return 'bg-emerald-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'scheduled': return 'bg-violet-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-amber-500';
    }
  };

  const webhookUrl = `${window.location.protocol}//${window.location.hostname}:3001/webhook`;

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-[230px] bg-gray-900 flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-[15px] text-white tracking-tight">WhatsApp CRM</span>
        </div>

        <nav className="flex-1 px-3 mt-1 space-y-0.5">
          {nav.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === item.id
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}>
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-up">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900">Overview</h2>
                <p className="text-sm text-gray-500 mt-0.5">Your WhatsApp CRM performance analytics</p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-5 border border-gray-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-xl" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Total Contacts</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-violet-500 rounded-l-xl" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Templates</p>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-xl" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Send className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Campaigns</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 text-white shadow-lg shadow-emerald-500/15">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-2xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{deliveryRate}% Rate</span>
                  </div>
                  <p className="text-2xl font-bold">{totalSent}</p>
                  <p className="text-xs text-emerald-100 mt-0.5">Messages Sent</p>
                  {totalFailed > 0 && <p className="text-xs text-red-200 mt-0.5">{totalFailed} failed</p>}
                </div>
              </div>

              {/* Quick actions */}
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick actions</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Add contact', sub: 'Single or CSV import', action: () => setIsAddContactOpen(true), icon: Users, color: 'emerald' },
                    { label: 'Create template', sub: 'With {{variables}}', action: () => setIsCreateTemplateOpen(true), icon: FileText, color: 'violet' },
                    { label: 'New broadcast', sub: 'Send or schedule', action: () => setIsNewBroadcastOpen(true), icon: Send, color: 'blue' },
                  ].map((a, i) => (
                    <button key={i} onClick={a.action}
                      className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all text-left group">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        a.color === 'emerald' ? 'bg-emerald-50 group-hover:bg-emerald-100' :
                        a.color === 'violet' ? 'bg-violet-50 group-hover:bg-violet-100' :
                        'bg-blue-50 group-hover:bg-blue-100'
                      }`}>
                        <a.icon className={`w-4 h-4 ${
                          a.color === 'emerald' ? 'text-emerald-600' :
                          a.color === 'violet' ? 'text-violet-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{a.label}</p>
                        <p className="text-xs text-gray-400">{a.sub}</p>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent campaigns */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent campaigns</h3>
                  {campaigns.length > 0 && (
                    <button onClick={() => setActiveTab('campaigns')} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {campaigns.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No campaigns yet</p>
                    <p className="text-xs text-gray-400 mt-0.5">Create a broadcast to get started</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
                    {campaigns.slice(0, 5).map(camp => (
                      <div key={camp.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${statusDot(camp.status)}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{camp.name}</p>
                            <p className="text-xs text-gray-400">{camp.template?.name} · {new Date(camp.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-medium">{camp.sentMessages || 0} sent</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(camp.status)}`}>{camp.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== CONTACTS ===== */}
          {activeTab === 'contacts' && (
            <div className="animate-fade-up">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{contacts.length} total contacts</p>
                </div>
                <button onClick={() => setIsAddContactOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/20">
                  <Plus className="w-4 h-4" /> Add contact
                </button>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full md:w-72 border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredContacts.length === 0 ? (
                      <tr><td colSpan={4} className="px-5 py-12 text-center text-sm text-gray-400">
                        {contactSearch ? 'No contacts match your search' : 'No contacts yet.'}
                      </td></tr>
                    ) : filteredContacts.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {(c.name || '?')[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{c.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-gray-500 font-mono text-xs">{c.phone}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                            c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>{c.status}</span>
                        </td>
                        <td className="px-5 py-3 text-right flex items-center justify-end gap-2">
                          <button onClick={() => setEditingContact(c)} className="text-gray-400 hover:text-emerald-600 transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteContact(c.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== TEMPLATES ===== */}
          {activeTab === 'templates' && (
            <div className="animate-fade-up">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Templates</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Reusable message templates with variable support</p>
                </div>
                <button onClick={() => setIsCreateTemplateOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/20">
                  <Plus className="w-4 h-4" /> New template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">No templates yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first template to send personalized messages</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map(tpl => {
                    const content = tpl.components?.[0]?.text || '';
                    const vars = tpl.components?.[0]?.variables || [];
                    return (
                      <div key={tpl.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow group">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-sm font-semibold text-gray-900">{tpl.name}</h3>
                              <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded uppercase">{tpl.language}</span>
                            </div>
                            {content && (
                              <p className="text-sm text-gray-600 mt-2 leading-relaxed bg-gray-50 rounded-lg p-3">{content}</p>
                            )}
                            {vars.length > 0 && (
                              <div className="flex gap-1.5 mt-2.5">
                                {vars.map((v: string) => (
                                  <span key={v} className="text-[11px] font-mono font-semibold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md">{`{{${v}}}`}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button onClick={() => setEditingTemplate(tpl)}
                              className="text-gray-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteTemplate(tpl.id)}
                              className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== CAMPAIGNS ===== */}
          {activeTab === 'campaigns' && (
            <div className="animate-fade-up">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Campaigns</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{campaigns.length} campaigns · {totalSent} messages sent</p>
                </div>
                <button onClick={() => setIsNewBroadcastOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-600/20">
                  <Plus className="w-4 h-4" /> New broadcast
                </button>
              </div>

              {campaigns.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
                  <Send className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">No campaigns yet</p>
                  <p className="text-xs text-gray-400 mt-1">Launch your first broadcast</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(camp => {
                    const total = camp.totalMessages || 0;
                    const sent = camp.sentMessages || 0;
                    const failed = camp.failedMessages || 0;
                    const delivered = camp.deliveredCount || 0;
                    const pct = total > 0 ? Math.round((sent / total) * 100) : 0;

                    return (
                      <div key={camp.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2.5">
                              <div className={`w-2 h-2 rounded-full ${statusDot(camp.status)}`} />
                              <h3 className="text-sm font-semibold text-gray-900">{camp.name}</h3>
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle(camp.status)}`}>{camp.status}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 ml-[18px]">
                              {camp.template?.name} · {camp.scheduledAt
                                ? <><Calendar className="w-3 h-3 inline" /> Scheduled for {new Date(camp.scheduledAt).toLocaleString()}</>
                                : new Date(camp.createdAt).toLocaleString()
                              }
                            </p>
                          </div>
                        </div>

                        {total > 0 && (
                          <div className="mb-3 ml-[18px]">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Delivery</span>
                              <span className="font-medium text-gray-600">{pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full transition-all duration-700 ${
                                camp.status === 'failed' ? 'bg-red-500' : camp.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="flex gap-5 text-xs text-gray-500 ml-[18px]">
                          <span className="flex items-center gap-1"><Target className="w-3 h-3 text-gray-400" />{total} targeted</span>
                          <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" />{sent} sent</span>
                          {failed > 0 && <span className="flex items-center gap-1"><XCircle className="w-3 h-3 text-red-400" />{failed} failed</span>}
                          {delivered > 0 && <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-blue-500" />{delivered} delivered</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === 'settings' && (
            <div className="animate-fade-up">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage your WhatsApp Business API connection & webhooks</p>
              </div>

              <div className="max-w-lg space-y-6">

                {/* 1-Click Meta Embedded Signup Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> WhatsApp Connection Status
                    </h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                      isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed mb-5">
                    Connect your official WhatsApp Business number with 1-click using Facebook OAuth. No technical setup required!
                  </p>

                  {settingsMsg && (
                    <div className={`text-xs p-3 rounded-lg mb-4 flex items-start gap-2 ${settingsMsg.includes('Success') || settingsMsg.includes('saved') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{settingsMsg}</span>
                    </div>
                  )}

                  {/* Facebook 1-Click Connect Button */}
                  <button
                    onClick={launchFacebookEmbeddedSignup}
                    className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-medium py-3 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm shadow-[#1877F2]/20"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    {isConnected ? 'Re-connect WhatsApp with Facebook' : 'Connect WhatsApp with Facebook'}
                  </button>

                  {/* Expandable Manual Credentials Fallback */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setShowManualSettings(!showManualSettings)}
                      className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      {showManualSettings ? 'Hide Manual Technical Settings' : 'Advanced: Manual Credentials Entry'}
                      {showManualSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showManualSettings && (
                      <form onSubmit={handleSaveSettings} className="mt-4 space-y-4 animate-fade-in pt-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone Number ID</label>
                          <input
                            type="text"
                            value={phoneNumberId}
                            onChange={e => setPhoneNumberId(e.target.value)}
                            placeholder="e.g. 102938475610293"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">Access Token</label>
                          <input
                            type="password"
                            value={accessToken}
                            onChange={e => setAccessToken(e.target.value)}
                            placeholder="Leave blank to keep existing token..."
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">WABA ID (Business Account ID)</label>
                          <input
                            type="text"
                            value={wabaId}
                            onChange={e => setWabaId(e.target.value)}
                            placeholder="e.g. 1234567890"
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1.5">App Secret</label>
                          <input
                            type="password"
                            value={appSecret}
                            onChange={e => setAppSecret(e.target.value)}
                            placeholder="Meta App Secret..."
                            className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={settingsLoading}
                          className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                        >
                          {settingsLoading ? 'Saving...' : 'Save Manual Credentials'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Webhook Setup Instructions Card */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-blue-600" /> Meta Webhook Configuration
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">Paste this URL into your Meta for Developers App dashboard under Webhooks configuration.</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Callback URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={webhookUrl}
                          className="flex-1 border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-700"
                        />
                        <button
                          onClick={copyWebhook}
                          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        >
                          {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedWebhook ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
                      <b>Verification Token:</b> Matches <code className="bg-white px-1 py-0.5 rounded font-mono">whatsapp_crm_verify_token</code> (or <code>WEBHOOK_VERIFY_TOKEN</code> in your <code>.env</code>).
                    </div>
                  </div>
                </div>

                {/* Account Info */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Account Info</h3>
                  <p className="text-xs text-gray-400 mb-3">Logged in user session:</p>
                  <div className="bg-gray-50 rounded-lg px-3.5 py-2.5 border border-gray-100 flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-bold">A</div>
                    <p className="text-sm text-gray-700 font-mono">admin@example.com</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <AddContactModal isOpen={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} onSuccess={fetchContacts} />
      <EditContactModal contact={editingContact} isOpen={!!editingContact} onClose={() => setEditingContact(null)} onSuccess={fetchContacts} />
      <NewBroadcastModal isOpen={isNewBroadcastOpen} onClose={() => setIsNewBroadcastOpen(false)} onSuccess={fetchCampaigns} />
      <CreateTemplateModal isOpen={isCreateTemplateOpen} onClose={() => setIsCreateTemplateOpen(false)} onSuccess={fetchTemplates} />
      <EditTemplateModal template={editingTemplate} isOpen={!!editingTemplate} onClose={() => setEditingTemplate(null)} onSuccess={fetchTemplates} />
    </div>
  );
}

export default App;
