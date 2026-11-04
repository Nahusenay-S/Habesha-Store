import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Icon from '../components/Icon';
import { adminAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/admin-dashboard.module.css';

const SALES_DATA = [
  { date: '1 Aug', label: 'August, 1', sold: 45, returns: 0 },
  { date: '5 Aug', label: 'August, 5', sold: 82, returns: 2 },
  { date: '10 Aug', label: 'August, 10', sold: 68, returns: 1 },
  { date: '13 Aug', label: 'August, 13', sold: 94, returns: 3 },
  { date: '15 Aug', label: 'August, 15', sold: 104, returns: 0 },
  { date: '20 Aug', label: 'August, 20', sold: 76, returns: 1 },
  { date: '22 Aug', label: 'August, 22', sold: 58, returns: 0 },
  { date: '25 Aug', label: 'August, 25', sold: 89, returns: 2 },
  { date: '28 Aug', label: 'August, 28', sold: 72, returns: 0 },
  { date: '30 Aug', label: 'August, 30', sold: 85, returns: 1 },
  { date: '31 Aug', label: 'August, 31', sold: 98, returns: 1 },
];

const AdminDashboardPage = () => {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'analytics' | 'orders' | 'products' | 'transactions' | 'shipping' | 'users'
  const [usersList, setUsersList] = useState(null);
  const [productsList, setProductsList] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [hoveredBar, setHoveredBar] = useState(4); // default tooltip on August 15

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.replace('/dashboard');
    }
    if (user?.role === 'admin') {
      adminAPI.getOverview()
        .then((response) => {
          setData(response.data);
          setForm(response.data.paymentConfig);
        })
        .catch((requestError) => {
          setError(requestError.response?.data?.error || 'Unable to load admin console.');
        });
    }
  }, [authLoading, user, router]);

  const loadUsers = () => {
    if (usersList) return;
    setLoadingUsers(true);
    adminAPI.getUsers()
      .then((res) => setUsersList(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Unable to load user list.'))
      .finally(() => setLoadingUsers(false));
  };

  const loadProducts = () => {
    if (productsList) return;
    setLoadingProducts(true);
    adminAPI.getProducts()
      .then((res) => setProductsList(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Unable to load catalog products.'))
      .finally(() => setLoadingProducts(false));
  };

  const handleToggleUser = async (userId, currentStatus) => {
    setActionMessage('');
    setError('');
    try {
      const nextStatus = !currentStatus;
      await adminAPI.toggleUserStatus(userId, nextStatus);
      setUsersList((curr) => curr.map((u) => (u.id === userId ? { ...u, isActive: nextStatus } : u)));
      setActionMessage('User account status updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  const handleToggleProduct = async (productId, currentStatus) => {
    setActionMessage('');
    setError('');
    try {
      const nextStatus = !currentStatus;
      await adminAPI.toggleProductStatus(productId, nextStatus);
      setProductsList((curr) => curr.map((p) => (p._id === productId ? { ...p, isActive: nextStatus } : p)));
      setActionMessage('Product listing status updated successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product listing status.');
    }
  };

  const handleSaveConfig = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const response = await adminAPI.updatePaymentConfig(form);
      setForm(response.data);
      setMessage('Platform runtime configuration updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Unable to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!data?.recentOrders) return;
    const headers = ['Order ID', 'Buyer', 'Seller', 'Total', 'Currency', 'Status', 'Payment Status'];
    const rows = data.recentOrders.map((o) => [
      `#${o._id.slice(0, 8).toUpperCase()}`,
      `"${o.buyerName}"`,
      `"${o.sellerName}"`,
      o.totalAmount,
      form?.currency || 'ETB',
      o.status,
      o.paymentStatus,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `habesha_store_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (authLoading || !user || user.role !== 'admin' || !data || !form) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8f4', fontFamily: 'sans-serif' }}>
        <p style={{ color: '#4b5563', fontSize: '1rem', fontWeight: 500 }}>Connecting to Habesha Admin Operations...</p>
      </main>
    );
  }

  const updateProvider = (provider, key, value) => {
    setForm((current) => ({
      ...current,
      paymentMethods: {
        ...current.paymentMethods,
        [provider]: {
          ...current.paymentMethods[provider],
          [key]: value,
        },
      },
    }));
  };

  const recentOrdersCount = data.recentOrders?.length || 0;
  const totalRevenueNumber = Number(data.metrics?.revenue?.total || 15650).toLocaleString();
  const totalCustomersCount = data.metrics?.users?.total || 1226;
  const totalOrdersCount = data.metrics?.orders?.total || 15210;

  return (
    <>
      <Head>
        <title>Admin Dashboard | Habesha Store</title>
      </Head>

      <div className={styles.dashboard}>
        {/* TOPBAR NAVIGATION */}
        <header className={styles.topbar}>
          <div className={styles.brandGroup}>
            <div className={styles.brandLogo}>
              <span>H</span>
            </div>
            <span className={styles.brandName}>Habesha Admin</span>
          </div>

          {/* Navigation Pills */}
          <nav className={styles.navPills}>
            <button
              type="button"
              className={`${styles.pill} ${activeTab === 'overview' ? styles.pillActive : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`${styles.pill} ${activeTab === 'analytics' ? styles.pillActive : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
            <button
              type="button"
              className={`${styles.pill} ${activeTab === 'orders' ? styles.pillActive : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              Order <span className={styles.pillBadge}>{recentOrdersCount}</span>
            </button>
            <button
              type="button"
              className={`${styles.pill} ${activeTab === 'products' ? styles.pillActive : ''}`}
              onClick={() => {
                setActiveTab('products');
                loadProducts();
              }}
            >
              Product
            </button>
            <button
              type="button"
              className={`${styles.pill} ${activeTab === 'transactions' ? styles.pillActive : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              Transaction
            </button>
            <button
              type="button"
              className={`${styles.pill} ${activeTab === 'shipping' ? styles.pillActive : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              Shipping & Gateway
            </button>
            <button
              type="button"
              className={`${styles.pill} ${activeTab === 'users' ? styles.pillActive : ''}`}
              onClick={() => {
                setActiveTab('users');
                loadUsers();
              }}
            >
              Users
            </button>
          </nav>

          {/* Topbar Actions */}
          <div className={styles.topbarActions}>
            <Link href="/" target="_blank" className={styles.storeLink} title="Open customer-facing marketplace in a new tab">
              <span>View Storefront</span>
              <span>↗</span>
            </Link>

            <button type="button" className={styles.iconBtn} aria-label="Search" title="Search dashboard">
              <Icon name="search" size={16} />
            </button>

            <button type="button" className={styles.iconBtn} aria-label="Notifications" title="System alerts">
              <span>🔔</span>
            </button>

            {/* Admin Profile Dropdown */}
            <div className={styles.userMenu}>
              <div
                className={styles.userPill}
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <div className={styles.userAvatar}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span>{user.name || 'Admin'}</span>
                <span style={{ fontSize: '0.7rem' }}>⌵</span>
              </div>

              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #eae8df',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    minWidth: '180px',
                    padding: '0.5rem',
                    zIndex: 200,
                  }}
                >
                  <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #f3f4f6', fontSize: '0.78rem', color: '#6b7280' }}>
                    Signed in as <strong>{user.email}</strong>
                  </div>
                  <Link
                    href="/"
                    style={{ display: 'block', padding: '0.6rem 0.75rem', fontSize: '0.85rem', color: '#111827', textDecoration: 'none', borderRadius: '6px' }}
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    🏪 Public Marketplace
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push('/login');
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '0.6rem 0.75rem',
                      fontSize: '0.85rem',
                      color: '#b91c1c',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <div className={styles.content}>
          {actionMessage && (
            <div style={{ background: '#f5faf7', border: '1px solid #bce3cb', padding: '0.85rem 1.25rem', marginBottom: '1.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#134e35', fontWeight: 600, fontSize: '0.88rem' }}>✓ {actionMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW (EXACT LAYOUT FROM USER REFERENCE SCREENSHOT) */}
          {activeTab === 'overview' && (
            <>
              {/* Header Title & Date Range / Export */}
              <div className={styles.headerRow}>
                <div>
                  <h1 className={styles.headerTitle}>Overview</h1>
                  <p className={styles.headerSubtitle}>Detailed information about your store</p>
                </div>
                <div className={styles.headerControls}>
                  <select
                    className={styles.selectRange}
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="month">This month</option>
                    <option value="week">This week</option>
                    <option value="year">All time</option>
                  </select>

                  <button type="button" className={styles.exportBtn} onClick={handleExport}>
                    <span>Export</span>
                    <span>⭳</span>
                  </button>
                </div>
              </div>

              {/* Main Grid: Left KPI Stack (3 cards) + Right Sales Analytics Card */}
              <div className={styles.mainGrid}>
                {/* Left Column: 3 KPI Cards */}
                <div className={styles.kpiStack}>
                  {/* Card 1: Total Revenue */}
                  <div className={styles.kpiCard}>
                    <div>
                      <div className={styles.kpiLabel}>Total Revenue</div>
                      <div className={styles.kpiValueRow}>
                        <span className={styles.kpiAmount}>{form.currency} {totalRevenueNumber}</span>
                        <span className={styles.kpiGrowthPill}>+30.4%</span>
                      </div>
                      <span className={styles.kpiSubtext}>{form.currency} 12,000 last month</span>
                    </div>
                    {/* SVG Sparkline Bars */}
                    <div className={styles.kpiChartContainer}>
                      <svg width="78" height="42" viewBox="0 0 78 42" fill="none">
                        <rect x="2" y="24" width="9" height="18" rx="4" fill="#84cc16" />
                        <rect x="18" y="16" width="9" height="26" rx="4" fill="#84cc16" />
                        <rect x="34" y="28" width="9" height="14" rx="4" fill="#84cc16" />
                        <rect x="50" y="8" width="9" height="34" rx="4" fill="#84cc16" />
                        <rect x="66" y="2" width="9" height="40" rx="4" fill="#84cc16" />
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.62rem', color: '#9ca3af', marginTop: '4px' }}>
                        <span>Mar</span>
                        <span>Apr</span>
                        <span>May</span>
                        <span>Jun</span>
                        <span>Jul</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Total Customers */}
                  <div className={styles.kpiCard}>
                    <div>
                      <div className={styles.kpiLabel}>Total Customers</div>
                      <div className={styles.kpiValueRow}>
                        <span className={styles.kpiAmount}>{totalCustomersCount}</span>
                        <span className={styles.kpiGrowthPill}>+79.6%</span>
                      </div>
                      <span className={styles.kpiSubtext}>683 users last month</span>
                    </div>
                    {/* Donut Chart */}
                    <div className={styles.kpiChartContainer}>
                      <div style={{ position: 'relative', width: '54px', height: '54px' }}>
                        <svg width="54" height="54" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4.5" />
                          <circle
                            cx="18"
                            cy="18"
                            r="14"
                            fill="none"
                            stroke="#84cc16"
                            strokeWidth="4.5"
                            strokeDasharray="63 100"
                            strokeDashoffset="25"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: '#111827' }}>
                          63%
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', color: '#6b7280', marginTop: '4px' }}>
                        <span>● Collectors</span>
                        <span>○ Artisans</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Total Orders */}
                  <div className={styles.kpiCard}>
                    <div>
                      <div className={styles.kpiLabel}>Total Orders</div>
                      <div className={styles.kpiValueRow}>
                        <span className={styles.kpiAmount}>{totalOrdersCount}</span>
                        <span className={styles.kpiGrowthPill}>+51.3%</span>
                      </div>
                      <span className={styles.kpiSubtext}>10,056 orders last month</span>
                    </div>
                    {/* Spline Wave Trendline */}
                    <div className={styles.kpiChartContainer}>
                      <svg width="86" height="34" viewBox="0 0 86 34" fill="none">
                        <path
                          d="M2 14C12 28 22 28 32 14C42 0 52 0 62 14C72 26 78 18 84 8"
                          stroke="#84cc16"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="84" cy="8" r="3.5" fill="#84cc16" />
                      </svg>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.62rem', color: '#9ca3af', marginTop: '4px' }}>
                        <span>1 Jul</span>
                        <span>8 Jul</span>
                        <span>16 Jul</span>
                        <span>25 Jul</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Sales Analytics Chart */}
                <div className={styles.analyticsCard}>
                  <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>Sales Analytics</h3>
                    <div className={styles.chartLegend}>
                      <span><span className={styles.legendDotSold} /> Products sold</span>
                      <span><span className={styles.legendDotReturn} /> Product returns</span>
                    </div>
                  </div>

                  {/* Bar Chart Area with Y-axis and hover tooltip */}
                  <div className={styles.barChartWrapper}>
                    <div className={styles.yAxisLabels}>
                      <span>105</span>
                      <span>90</span>
                      <span>80</span>
                      <span>65</span>
                      <span>55</span>
                      <span>45</span>
                      <span>10</span>
                      <span>0</span>
                    </div>

                    <div className={styles.barsArea}>
                      {SALES_DATA.map((item, idx) => {
                        const heightPct = Math.round((item.sold / 110) * 100);
                        const isHovered = hoveredBar === idx;

                        return (
                          <div
                            key={item.date}
                            className={styles.barCol}
                            onMouseEnter={() => setHoveredBar(idx)}
                          >
                            {isHovered && (
                              <div className={styles.tooltip}>
                                <div style={{ fontWeight: 700, marginBottom: '2px' }}>{item.label}</div>
                                <div style={{ color: '#84cc16' }}>● Sold {item.sold}</div>
                                <div style={{ color: '#9ca3af' }}>○ Return {item.returns}</div>
                              </div>
                            )}

                            <div className={styles.barPillar} style={{ height: '170px' }}>
                              <div
                                className={styles.barSoldFill}
                                style={{
                                  height: `${heightPct}%`,
                                  background: isHovered ? '#65a30d' : '#84cc16',
                                }}
                              />
                            </div>
                            <span className={styles.barLabel}>{item.date}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom 3-Widget Row: Top sales by country/region + Product sales table + Last activity */}
              <div className={styles.bottomGrid}>
                {/* Widget 1: Top sales by region / destination */}
                <div className={styles.widgetCard}>
                  <div className={styles.widgetHeader}>
                    <h4 className={styles.widgetTitle}>Top sales by region</h4>
                    <button type="button" className={styles.seeAllBtn} onClick={() => setActiveTab('analytics')}>
                      See all
                    </button>
                  </div>
                  <div className={styles.regionList}>
                    <div className={styles.regionItem}>
                      <span className={styles.regionFlag}>🇪🇹</span>
                      <div className={styles.regionDetails}>
                        <div className={styles.regionMeta}>
                          <span>Addis Ababa & Central</span>
                          <span>53%</span>
                        </div>
                        <div className={styles.regionTrack}>
                          <div className={styles.regionFill} style={{ width: '53%' }} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.regionItem}>
                      <span className={styles.regionFlag}>🇺🇸</span>
                      <div className={styles.regionDetails}>
                        <div className={styles.regionMeta}>
                          <span>Diaspora (North America)</span>
                          <span>28%</span>
                        </div>
                        <div className={styles.regionTrack}>
                          <div className={styles.regionFill} style={{ width: '28%' }} />
                        </div>
                      </div>
                    </div>

                    <div className={styles.regionItem}>
                      <span className={styles.regionFlag}>🌿</span>
                      <div className={styles.regionDetails}>
                        <div className={styles.regionMeta}>
                          <span>Highland Guilds & Hawassa</span>
                          <span>19%</span>
                        </div>
                        <div className={styles.regionTrack}>
                          <div className={styles.regionFill} style={{ width: '19%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Widget 2: Product sales table */}
                <div className={styles.widgetCard}>
                  <div className={styles.widgetHeader}>
                    <h4 className={styles.widgetTitle}>Product sales</h4>
                    <button type="button" className={styles.seeAllBtn} onClick={() => { setActiveTab('products'); loadProducts(); }}>
                      See all
                    </button>
                  </div>
                  <table className={styles.productTable}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Stock</th>
                        <th>Price</th>
                        <th style={{ textAlign: 'right' }}>Items sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className={styles.productRowInfo}>
                            <img src="/images/heritage-textile.jpg" alt="Tibeb Dress" className={styles.productRowThumb} />
                            <span className={styles.productRowName}>Handwoven Tibeb Dress</span>
                          </div>
                        </td>
                        <td>118</td>
                        <td>{form.currency} 3,850</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>294</td>
                      </tr>
                      <tr>
                        <td>
                          <div className={styles.productRowInfo}>
                            <img src="/images/coffee.jpg" alt="Highland Roast" className={styles.productRowThumb} />
                            <span className={styles.productRowName}>Yirgacheffe Roast</span>
                          </div>
                        </td>
                        <td>29</td>
                        <td>{form.currency} 1,450</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>569</td>
                      </tr>
                      <tr>
                        <td>
                          <div className={styles.productRowInfo}>
                            <img src="/images/pottery.jpg" alt="Jebena" className={styles.productRowThumb} />
                            <span className={styles.productRowName}>Ceremonial Clay Jebena</span>
                          </div>
                        </td>
                        <td>98</td>
                        <td>{form.currency} 2,200</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>162</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Widget 3: Last activity feed */}
                <div className={styles.widgetCard}>
                  <div className={styles.widgetHeader}>
                    <h4 className={styles.widgetTitle}>Last activity</h4>
                    <button type="button" className={styles.seeAllBtn} onClick={() => setActiveTab('orders')}>
                      See all
                    </button>
                  </div>
                  <div className={styles.activityList}>
                    {data.recentOrders.slice(0, 3).map((order, i) => {
                      const names = ['Alia Bonner', 'Millie Tran', 'Natalia Bloggs'];
                      const displayName = order.buyerName || names[i] || 'Collector';
                      return (
                        <div key={order._id} className={styles.activityItem}>
                          <div className={styles.activityLeft}>
                            <div className={styles.activityAvatar} style={{ background: i === 0 ? '#fef3c7' : i === 1 ? '#e0e7ff' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#111827' }}>
                              {displayName.charAt(0)}
                            </div>
                            <div>
                              <h5 className={styles.activityName}>{displayName}</h5>
                              <p className={styles.activityAction}>Purchased order #{order._id.slice(0, 6).toUpperCase()}</p>
                            </div>
                          </div>
                          <Badge variant={order.paymentStatus === 'completed' ? 'success' : 'gold'} size="sm">
                            {form.currency} {Number(order.totalAmount).toFixed(0)}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className={styles.tabPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Platform Financials & Growth Analytics</h2>
                  <p style={{ color: '#6b7280', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                    Historical Gross Merchandise Value, conversion rates, and settlement health.
                  </p>
                </div>
                <Badge variant="gold" size="sm">Neon SSL DB</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Settled Revenue (GMV)</span>
                  <strong style={{ fontSize: '1.5rem', color: '#111827', display: 'block', margin: '0.3rem 0' }}>
                    {form.currency} {Number(data.metrics.revenue.total).toLocaleString()}
                  </strong>
                  <small style={{ color: '#16a34a' }}>✓ {data.metrics.revenue.paid_orders} settled orders</small>
                </div>

                <div style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Artisan Product Supply</span>
                  <strong style={{ fontSize: '1.5rem', color: '#111827', display: 'block', margin: '0.3rem 0' }}>
                    {data.metrics.products.active} Active Listings
                  </strong>
                  <small style={{ color: '#6b7280' }}>{data.metrics.products.total} total catalog items</small>
                </div>

                <div style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block' }}>Community Demographics</span>
                  <strong style={{ fontSize: '1.5rem', color: '#111827', display: 'block', margin: '0.3rem 0' }}>
                    {data.metrics.users.total} Total Members
                  </strong>
                  <small style={{ color: '#6b7280' }}>{data.metrics.users.sellers} Sellers · {data.metrics.users.buyers} Collectors</small>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDER MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className={styles.tabPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Order Fulfillment & Transaction Audit</h2>
                  <p style={{ color: '#6b7280', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                    Recent marketplace customer purchases and artisan fulfillment records.
                  </p>
                </div>
                <button type="button" className={styles.exportBtn} onClick={handleExport}>
                  Export CSV ⭳
                </button>
              </div>

              {data.recentOrders.length ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Order Ref</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Collector / Buyer</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Artisan Guild</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Total Amount</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Order Status</th>
                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Payment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((order) => (
                        <tr key={order._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <strong style={{ color: '#111827' }}>#{order._id.slice(0, 8).toUpperCase()}</strong>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>{order.buyerName}</td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>{order.sellerName}</td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <strong>{form.currency} {Number(order.totalAmount).toFixed(2)}</strong>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'shipped' ? 'info' : 'gold'} size="sm">
                              {order.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                            <Badge variant={order.paymentStatus === 'completed' ? 'success' : 'gold'} size="sm">
                              {order.paymentStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>No transactions recorded in this period.</p>
              )}
            </div>
          )}

          {/* TAB 4: PRODUCT MODERATION */}
          {activeTab === 'products' && (
            <div className={styles.tabPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Artisan Product Catalog Moderation</h2>
                  <p style={{ color: '#6b7280', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                    Oversee inventory, pricing, ratings, and listing availability across all artisan workshops.
                  </p>
                </div>
                <Badge variant="gold" size="sm">{productsList?.length || 0} Total Listings</Badge>
              </div>

              {loadingProducts ? (
                <p style={{ padding: '2rem 0', textAlign: 'center', color: '#6b7280' }}>Loading catalog items...</p>
              ) : !productsList || productsList.length === 0 ? (
                <p style={{ padding: '2rem 0', textAlign: 'center', color: '#6b7280' }}>No products found.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Piece Title</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Artisan Seller</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Price & Stock</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>State</th>
                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Moderation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsList.map((p) => (
                        <tr key={p._id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <strong style={{ color: '#111827', display: 'block' }}>{p.name}</strong>
                            <small style={{ color: '#6b7280' }}>★ {Number(p.rating || 0).toFixed(1)} ({p.reviewCount} reviews)</small>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>{p.seller?.name || 'Artisan'}</td>
                          <td style={{ padding: '0.85rem 0.5rem', textTransform: 'capitalize' }}>
                            <Badge variant="outline" size="sm">{p.category}</Badge>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <strong>{form.currency} {Number(p.price).toFixed(2)}</strong>
                            <small style={{ display: 'block', color: p.stock < 5 ? '#c0392b' : '#6b7280' }}>Stock: {p.stock}</small>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <Badge variant={p.isActive ? 'success' : 'danger'} size="sm">
                              {p.isActive ? 'Listed' : 'Delisted'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                            <Button
                              variant={p.isActive ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => handleToggleProduct(p._id, p.isActive)}
                            >
                              {p.isActive ? 'Unlist' : 'Re-list'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className={styles.tabPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Financial Transactions & Gateway Ledger</h2>
                  <p style={{ color: '#6b7280', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                    Payment methods, settlement statuses, and refund records.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: '#fdf9f0', border: '1px solid #e8dbb5', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#854d0e', fontWeight: 600 }}>TELEBIRR VOLUME</span>
                  <h3 style={{ margin: '0.3rem 0', color: '#111827' }}>{form.currency} {Number(data.metrics.revenue.total * 0.65).toFixed(2)}</h3>
                  <small style={{ color: '#6b7280' }}>Primary Ethiopian domestic rail</small>
                </div>
                <div style={{ padding: '1rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b21a8', fontWeight: 600 }}>STRIPE GLOBAL</span>
                  <h3 style={{ margin: '0.3rem 0', color: '#111827' }}>USD {Number(data.metrics.revenue.total * 0.25 / 120).toFixed(2)}</h3>
                  <small style={{ color: '#6b7280' }}>International card settlements</small>
                </div>
                <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>PAYPAL EXPRESS</span>
                  <h3 style={{ margin: '0.3rem 0', color: '#111827' }}>USD {Number(data.metrics.revenue.total * 0.1 / 120).toFixed(2)}</h3>
                  <small style={{ color: '#6b7280' }}>Diaspora digital wallet</small>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SHIPPING & GATEWAY CONFIG */}
          {activeTab === 'shipping' && (
            <div className={styles.tabPanel} style={{ maxWidth: '820px' }}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Payment Providers & Highland Shipping Rates</h2>
                  <p style={{ color: '#6b7280', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                    Configure marketplace base currency, delivery thresholds, and live payment gateways.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveConfig} style={{ display: 'grid', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                    Marketplace Currency:
                  </label>
                  <input
                    value={form.currency}
                    maxLength="3"
                    onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                      Flat Shipping Rate ({form.currency}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.shipping.flatRate}
                      onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, flatRate: e.target.value } })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>
                      Free Delivery Threshold ({form.currency}):
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.shipping.freeThreshold}
                      onChange={(e) => setForm({ ...form, shipping: { ...form.shipping, freeThreshold: e.target.value } })}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                {['telebirr', 'stripe', 'paypal'].map((provider) => (
                  <fieldset key={provider} style={{ border: '1px solid #eae8df', borderRadius: '12px', padding: '1rem 1.25rem', marginTop: '0.5rem' }}>
                    <legend style={{ textTransform: 'capitalize', fontWeight: 700, padding: '0 0.4rem', color: '#111827' }}>
                      {provider} Gateway
                    </legend>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', margin: '0.5rem 0' }}>
                      <input
                        type="checkbox"
                        checked={form.paymentMethods[provider]?.enabled || false}
                        onChange={(e) => updateProvider(provider, 'enabled', e.target.checked)}
                      />
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Enable {provider} during customer checkout</span>
                    </label>

                    {provider === 'telebirr' && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.25rem' }}>Merchant Name:</label>
                        <input
                          value={form.paymentMethods.telebirr?.merchantName || ''}
                          onChange={(e) => updateProvider('telebirr', 'merchantName', e.target.value)}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                        />
                      </div>
                    )}

                    {provider === 'stripe' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.25rem' }}>Publishable Key:</label>
                          <input
                            value={form.paymentMethods.stripe?.publishableKey || ''}
                            onChange={(e) => updateProvider('stripe', 'publishableKey', e.target.value)}
                            style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.25rem' }}>Currency:</label>
                          <input
                            value={form.paymentMethods.stripe?.currency || 'usd'}
                            maxLength="3"
                            onChange={(e) => updateProvider('stripe', 'currency', e.target.value.toLowerCase())}
                            style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                          />
                        </div>
                      </div>
                    )}

                    {provider === 'paypal' && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.82rem', color: '#6b7280', marginBottom: '0.25rem' }}>Client ID:</label>
                        <input
                          value={form.paymentMethods.paypal?.clientId || ''}
                          onChange={(e) => updateProvider('paypal', 'clientId', e.target.value)}
                          style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px' }}
                        />
                      </div>
                    )}
                  </fieldset>
                ))}

                {message && <p style={{ color: '#16a34a', margin: '0.5rem 0' }}>✓ {message}</p>}
                {error && <p style={{ color: '#b91c1c', margin: '0.5rem 0' }}>✕ {error}</p>}

                <div style={{ marginTop: '0.75rem' }}>
                  <Button type="submit" variant="primary" size="md" loading={saving}>
                    Save Runtime Settings
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: USER GOVERNANCE */}
          {activeTab === 'users' && (
            <div className={styles.tabPanel}>
              <div className={styles.panelHeader}>
                <div>
                  <h2 className={styles.panelTitle}>Marketplace Community Accounts</h2>
                  <p style={{ color: '#6b7280', margin: '0.2rem 0 0', fontSize: '0.88rem' }}>
                    Oversee collector and artisan seller profiles, order counts, and security statuses.
                  </p>
                </div>
                <Badge variant="gold" size="sm">{usersList?.length || 0} Registered Users</Badge>
              </div>

              {loadingUsers ? (
                <p style={{ padding: '2rem 0', textAlign: 'center', color: '#6b7280' }}>Loading user registry...</p>
              ) : !usersList || usersList.length === 0 ? (
                <p style={{ padding: '2rem 0', textAlign: 'center', color: '#6b7280' }}>No users found.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6', color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '0.75rem 0.5rem' }}>User / Member</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Order Volume</th>
                        <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <strong style={{ color: '#111827', display: 'block' }}>{u.name}</strong>
                            <small style={{ color: '#6b7280' }}>{u.email}</small>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <Badge
                              variant={u.role === 'admin' ? 'info' : u.role === 'seller' ? 'gold' : 'outline'}
                              size="sm"
                            >
                              {u.role.toUpperCase()}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>{u.orderCount} orders</td>
                          <td style={{ padding: '0.85rem 0.5rem' }}>
                            <Badge variant={u.isActive ? 'success' : 'danger'} size="sm">
                              {u.isActive ? 'Active' : 'Suspended'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                            {u.id !== user.id && (
                              <Button
                                variant={u.isActive ? 'outline' : 'primary'}
                                size="sm"
                                onClick={() => handleToggleUser(u.id, u.isActive)}
                              >
                                {u.isActive ? 'Suspend' : 'Reactivate'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
